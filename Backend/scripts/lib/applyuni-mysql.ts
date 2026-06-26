/**
 * One-stop MySQL connector for the ApplyUniNow source database.
 *
 * Modes:
 *   1. Direct  — when APPLY_UNI_SSH_HOST is empty, connects straight to the
 *      configured MySQL host:port (e.g. when you already have a tunnel open
 *      in another terminal or MySQL really is local).
 *   2. SSH tunnel — when APPLY_UNI_SSH_HOST is set, opens a tunnel via ssh2
 *      using the configured key, then routes the mysql2 socket through it.
 *      No extra terminal window required.
 *
 * Env variables (only the SSH set is new — the MYSQL_* names match the
 * existing import scripts so nothing else has to change):
 *
 *   APPLY_UNI_MYSQL_HOST       host as seen FROM the bastion (usually
 *                              "localhost" or "127.0.0.1" if MySQL is on the
 *                              same EC2 box). Defaults to 127.0.0.1.
 *   APPLY_UNI_MYSQL_PORT       MySQL port as seen FROM the bastion. Default 3306.
 *   APPLY_UNI_MYSQL_USER       MySQL user
 *   APPLY_UNI_MYSQL_PASSWORD   MySQL password
 *   APPLY_UNI_MYSQL_DATABASE   MySQL database
 *
 *   APPLY_UNI_SSH_HOST         SSH bastion host (e.g. 52.66.143.139). When
 *                              set, tunnelling is enabled.
 *   APPLY_UNI_SSH_PORT         SSH port (default 22)
 *   APPLY_UNI_SSH_USER         SSH user (e.g. ubuntu)
 *   APPLY_UNI_SSH_KEY          Absolute path to a private key (.pem)
 *   APPLY_UNI_SSH_PASSPHRASE   Optional key passphrase
 */
import fs from 'node:fs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { Client as SshClient, ConnectConfig } from 'ssh2';

dotenv.config();

export interface ManagedConnection {
  conn: mysql.Connection;
  close: () => Promise<void>;
}

const env = (k: string, fallback?: string) => {
  const v = process.env[k];
  return v != null && v !== '' ? v : fallback;
};

const required = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing required env var: ${k}`);
  return v;
};

const baseMysqlOptions = () => ({
  user: required('APPLY_UNI_MYSQL_USER'),
  password: env('APPLY_UNI_MYSQL_PASSWORD', '')!,
  database: required('APPLY_UNI_MYSQL_DATABASE'),
});

export async function connectApplyUniMysql(): Promise<ManagedConnection> {
  const useTunnel = !!process.env.APPLY_UNI_SSH_HOST;

  if (!useTunnel) {
    const host = env('APPLY_UNI_MYSQL_HOST', '127.0.0.1')!;
    const port = Number(env('APPLY_UNI_MYSQL_PORT', '3306'));
    console.log(`[mysql] direct connection: ${baseMysqlOptions().user}@${host}:${port}/${baseMysqlOptions().database}`);
    const conn = await mysql.createConnection({ host, port, ...baseMysqlOptions() });
    return {
      conn,
      close: async () => {
        await conn.end().catch(() => undefined);
      },
    };
  }

  const sshHost = required('APPLY_UNI_SSH_HOST');
  const sshPort = Number(env('APPLY_UNI_SSH_PORT', '22'));
  const sshUser = required('APPLY_UNI_SSH_USER');
  // Key can come from a file path (laptop, mounted secret) OR a base64-encoded
  // inline string (useful for deploy targets that only expose env vars).
  let privateKey: Buffer | string;
  const inlineKeyB64 = process.env.APPLY_UNI_SSH_KEY_B64;
  if (inlineKeyB64) {
    privateKey = Buffer.from(inlineKeyB64, 'base64').toString('utf8');
  } else {
    const sshKeyPath = required('APPLY_UNI_SSH_KEY');
    if (!fs.existsSync(sshKeyPath)) {
      throw new Error(
        `SSH key not found at "${sshKeyPath}". Set APPLY_UNI_SSH_KEY to the absolute path of your .pem file, or set APPLY_UNI_SSH_KEY_B64 to a base64-encoded key.`,
      );
    }
    privateKey = fs.readFileSync(sshKeyPath);
  }

  const remoteMysqlHost = env('APPLY_UNI_MYSQL_HOST', '127.0.0.1')!;
  const remoteMysqlPort = Number(env('APPLY_UNI_MYSQL_PORT', '3306'));

  console.log(
    `[ssh]   tunneling ${sshUser}@${sshHost}:${sshPort} → ${remoteMysqlHost}:${remoteMysqlPort}`,
  );

  const ssh = new SshClient();
  const sshConfig: ConnectConfig = {
    host: sshHost,
    port: sshPort,
    username: sshUser,
    privateKey,
    readyTimeout: 20000,
    keepaliveInterval: 10000,
  };
  if (process.env.APPLY_UNI_SSH_PASSPHRASE) {
    sshConfig.passphrase = process.env.APPLY_UNI_SSH_PASSPHRASE;
  }

  await new Promise<void>((resolve, reject) => {
    const onError = (err: Error) => {
      ssh.removeAllListeners();
      reject(err);
    };
    ssh.once('ready', () => {
      ssh.removeListener('error', onError);
      resolve();
    });
    ssh.once('error', onError);
    ssh.connect(sshConfig);
  });

  // Open the TCP forward to MySQL and hand the stream to mysql2.
  const stream = await new Promise<NodeJS.ReadWriteStream>((resolve, reject) => {
    ssh.forwardOut('127.0.0.1', 0, remoteMysqlHost, remoteMysqlPort, (err, channel) => {
      if (err) return reject(err);
      resolve(channel);
    });
  });

  console.log(`[mysql] tunneled connection: ${baseMysqlOptions().user}@${remoteMysqlHost}:${remoteMysqlPort}/${baseMysqlOptions().database}`);

  const conn = await mysql.createConnection({
    ...baseMysqlOptions(),
    stream: stream as never, // mysql2 accepts a Duplex via the `stream` option
  });

  return {
    conn,
    close: async () => {
      await conn.end().catch(() => undefined);
      try {
        ssh.end();
      } catch {
        /* ignore */
      }
    },
  };
}

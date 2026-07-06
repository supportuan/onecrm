/** Keyword buckets used to map course names → study industries (country-filtered). */
export const STUDY_INDUSTRY_RULES: { name: string; pattern: string }[] = [
  { name: 'Business & Management', pattern: 'business|mba|management|finance|accounting|marketing|economics|commerce|entrepreneur' },
  { name: 'Computer Science & IT', pattern: 'computer|software|information technology|data science|cyber|artificial intelligence|informatics|computing|it ' },
  { name: 'Engineering & Technology', pattern: 'engineering|mechanical|civil|electrical|electronic|aerospace|robotics|manufacturing|mechatronic' },
  { name: 'Health Sciences & Medicine', pattern: 'medicine|medical|health science|physician|surgery|clinical|biomedical|dentistry|dental|optometry' },
  { name: 'Nursing & Midwifery', pattern: 'nursing|midwifery|nurse practitioner' },
  { name: 'Pharmacy & Pharmaceutical Sciences', pattern: 'pharmacy|pharmaceutical|pharmacology' },
  { name: 'Public Health', pattern: 'public health|epidemiology|health policy' },
  { name: 'Psychology & Behavioral Sciences', pattern: 'psychology|psychiatric|behavioral|counselling|counseling' },
  { name: 'Law & Legal Studies', pattern: 'law|legal|juris|llb|llm|barrister|solicitor' },
  { name: 'Education & Training', pattern: 'education|teaching|pedagogy|curriculum|early childhood' },
  { name: 'Arts, Design & Media', pattern: 'art |fine art|design|graphic|animation|film|media studies|photography|fashion' },
  { name: 'Performing Arts', pattern: 'music|theatre|theater|drama|dance|performing' },
  { name: 'Humanities & Social Sciences', pattern: 'history|philosophy|sociology|anthropology|political science|international relations|gender studies' },
  { name: 'Communication & Journalism', pattern: 'communication|journalism|broadcast|public relations' },
  { name: 'Natural Sciences', pattern: 'biology|chemistry|physics|biochemistry|genetics|microbiology|zoology|botany|neuroscience' },
  { name: 'Mathematics & Statistics', pattern: 'mathematics|math |statistics|actuarial' },
  { name: 'Environmental Sciences', pattern: 'environment|ecology|sustainability|climate|conservation' },
  { name: 'Agriculture & Food Sciences', pattern: 'agriculture|agronomy|horticulture|food science|viticulture' },
  { name: 'Architecture & Built Environment', pattern: 'architecture|urban planning|built environment|landscape architecture' },
  { name: 'Hospitality & Tourism', pattern: 'hospitality|tourism|hotel|culinary|event management' },
  { name: 'Sports & Recreation', pattern: 'sport|sports science|kinesiology|exercise science|physical education' },
  { name: 'Veterinary Science', pattern: 'veterinary|animal science' },
  { name: 'Aviation & Aerospace', pattern: 'aviation|aeronautic|pilot|flight' },
  { name: 'Marine & Ocean Sciences', pattern: 'marine|oceanograph|maritime|fisheries' },
  { name: 'Energy & Mining', pattern: 'petroleum|mining|energy engineering|oil and gas|renewable energy' },
  { name: 'Supply Chain & Logistics', pattern: 'supply chain|logistics|procurement|operations management' },
  { name: 'Real Estate & Property', pattern: 'real estate|property development|valuation' },
  { name: 'Social Work & Community Services', pattern: 'social work|community service|welfare|human services' },
  { name: 'Criminology & Security', pattern: 'criminology|forensic|security studies|policing' },
  { name: 'Linguistics & Languages', pattern: 'linguistic|language studies|translation|interpretation|tesol|tesl' },
  { name: 'Theology & Religious Studies', pattern: 'theology|divinity|religious studies|ministry' },
  { name: 'Biotechnology', pattern: 'biotechnology|bioengineering' },
  { name: 'Project Management', pattern: 'project management' },
  { name: 'Library & Information Science', pattern: 'library|information science|archival' },
  { name: 'Fashion & Textiles', pattern: 'textile|fashion design' },
];

export const buildIndustryCaseSql = () =>
  STUDY_INDUSTRY_RULES.map(
    (r, i) =>
      `WHEN c.name ~* '${r.pattern.replace(/'/g, "''")}' THEN '${r.name.replace(/'/g, "''")}'`
  ).join('\n      ');

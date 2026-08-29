import { resolveFormDropdowns } from './studentFormOptions';

const stamp = () => new Date().toISOString().slice(0, 10);

const namedLabel = (rows, selected, labelKey = 'name') => {
  if (selected == null || selected === '') return '';
  const row = (rows || []).find(
    (item) => String(item.id) === String(selected) || String(item[labelKey] || item.name) === String(selected)
  );
  return row ? String(row[labelKey] || row.name || '') : String(selected);
};

const downloadPdfBytes = (filename, bytes) => {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/** Filled Success Point-style enquiry form as a downloadable PDF. */
export const downloadStudentEnquiryForm = async (formOptions = {}, student = {}) => {
  const { jsPDF } = await import('jspdf');
  const d = resolveFormDropdowns(formOptions);
  const counsellorName = namedLabel(formOptions.counsellors || [], student.contactId, 'fullName');
  const studentName =
    student.fullName || [student.firstName, student.lastName].filter(Boolean).join(' ') || '';

  const values = {
    name: studentName,
    dob: student.dob || '',
    phone: student.phone || '',
    email: student.email || '',
    address: student.address || '',
    source: namedLabel(d.leadSources, student.source) || student.source || '',
    counsellor: counsellorName,
    sslcMark: student.sslcMark || '',
    overallMark: student.overallMark || '',
    diplomaCourse: student.diplomaCourse || '',
    diplomaYear: student.diplomaYear || '',
    workExperience: student.workExperience || '',
    level: student.level || '',
    examType: student.examType || '',
    englishPercent: student.englishPercent || '',
    country1: namedLabel(d.countries, student.countryId || student.preferredCountry) || student.preferredCountry || '',
    country2: namedLabel(d.countries, student.countryOption2Id),
    industry: namedLabel(d.industries, student.industryId),
    intakeMonth: student.intakeMonth || '',
    intakeYear: student.intakeYear || '',
    course1: student.course1 || student.preferredCourse || '',
    course2: student.course2 || '',
    hasPassport: student.hasPassport || '',
    travelledOutside: student.travelledOutside || '',
    studiedAbroad: student.studiedAbroad || '',
    banned: student.banned || '',
    visaRefused: student.visaRefused || '',
    appliedOtherAgent: student.appliedOtherAgent || '',
    ukVisa: student.ukVisa || '',
    visaType: student.visaType || '',
    visaFees: student.visaFees || '',
    innerLondon: student.innerLondon || '',
    outerLondon: student.outerLondon || '',
    notes: student.officeNotes || student.notes || '',
    officeDate: student.officeDate || stamp(),
    place: student.place || '',
  };

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const colGap = 8;
  const colW = (pageW - margin * 2 - colGap) / 2;
  let y = 16;
  let col = 0;
  let pendingHeight = 0;

  const ensure = (height) => {
    if (y + height <= pageH - 16) return;
    doc.addPage();
    y = 16;
    col = 0;
    pendingHeight = 0;
  };

  const fieldX = () => (col === 0 ? margin : margin + colW + colGap);

  const title = (text) => {
    ensure(12);
    col = 0;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(17);
    doc.text(text, margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(`Student Enquiry Form · ${stamp()}`, margin, y);
    y += 8;
  };

  const section = (text) => {
    if (col === 1) {
      y += pendingHeight || 11;
      col = 0;
      pendingHeight = 0;
    }
    ensure(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text(text.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };

  const field = (label, value, { full = false, tall = false } = {}) => {
    if (full && col === 1) {
      y += pendingHeight || 11;
      col = 0;
      pendingHeight = 0;
    }
    const width = full ? pageW - margin * 2 : colW;
    const lines = doc.splitTextToSize(String(value || ''), width);
    const valueLines = tall ? Math.max(lines.length, 2) : Math.max(lines.length, 1);
    const height = 6 + valueLines * 4.2;
    ensure(height + 2);
    const x = full ? margin : fieldX();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(label, x, y);
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text(lines.length ? lines : [''], x, y + 4.4);
    doc.setDrawColor(160);
    doc.setLineWidth(0.25);
    doc.line(x, y + height - 3.2, x + width, y + height - 3.2);
    if (full) {
      y += height;
      col = 0;
      pendingHeight = 0;
      return;
    }
    if (col === 0) {
      pendingHeight = height;
      col = 1;
      return;
    }
    y += Math.max(pendingHeight, height);
    col = 0;
    pendingHeight = 0;
  };

  title('Student Enquiry Form');

  section('Student details');
  field("Student's name", values.name, { full: true });
  field('Date of birth', values.dob);
  field('Mobile', values.phone);
  field('Email ID', values.email, { full: true });
  field('Address', values.address, { full: true, tall: true });

  section('Source of enquiry');
  field('Source of enquiry', values.source);
  field('Counsellor / POC', values.counsellor);

  section('Course details');
  field('SSLC (10th) mark %', values.sslcMark);
  field('Overall mark %', values.overallMark);
  field('Diploma / course completed', values.diplomaCourse);
  field('Year', values.diplomaYear);
  field('Working experience (years)', values.workExperience);
  field('Study level', values.level);
  field('Exam', values.examType);
  field('English / overall %', values.englishPercent);

  section('Course want to study');
  field('Option 1 — Country', values.country1);
  field('Option 2 — Country', values.country2);
  field('Study industry', values.industry);
  field('Intake', values.intakeMonth);
  field('Intake year', values.intakeYear);
  field('Course 1', values.course1);
  field('Course 2', values.course2, { full: true });

  section('Previous history');
  field('Do you have passport?', values.hasPassport);
  field('Travelled outside country of residence?', values.travelledOutside);
  field('Studied in any country before?', values.studiedAbroad);
  field('Ever been banned for any country?', values.banned);
  field('Ever been refused a visa?', values.visaRefused);
  field('Applied via another agent or own?', values.appliedOtherAgent);

  section('Office use only — visa information');
  field('UK / destination visa', values.ukVisa);
  field('Visa type', values.visaType);
  field('Visa fees (approx INR)', values.visaFees);
  field('Inner London', values.innerLondon);
  field('Outer London', values.outerLondon);
  field('Notes', values.notes, { full: true, tall: true });
  field('Date', values.officeDate);
  field('Place', values.place);

  if (col === 1) {
    y += pendingHeight || 11;
    col = 0;
    pendingHeight = 0;
  }
  ensure(28);
  y += 10;
  doc.setDrawColor(40);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + colW, y);
  doc.line(margin + colW + colGap, y, pageW - margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text('Counsellor name / signature', margin, y);
  doc.text('Student signature', margin + colW + colGap, y);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(110);
  doc.text(
    'Some course fees may vary. Refer to the university website for the current fee structure.',
    margin,
    y
  );

  downloadPdfBytes(`student-enquiry-form_${stamp()}.pdf`, doc.output('arraybuffer'));
};

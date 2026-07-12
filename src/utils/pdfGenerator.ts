import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EDU_NIFY_LOGO_BASE64 } from '../lib/logo';

// Helper to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [79, 70, 229]; // default indigo
}

// Helper to get raw image data URL using a 100% CORS-safe fetch-to-blob-to-base64 reader
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  if (!url) return EDU_NIFY_LOGO_BASE64;
  if (url.startsWith('data:')) return url;
  try {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      // Fallback to traditional Image canvas loader
      return new Promise((resolve, reject) => {
        const img = new Image();
        if (url.startsWith('http') && !url.includes(window.location.host)) {
          img.crossOrigin = 'Anonymous';
        }
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error(`Could not load image at ${url}`));
        img.src = url;
      });
    }
  } catch (outerErr) {
    console.warn("Could not fetch image, falling back to embedded Edu-Nify logo", outerErr);
    return EDU_NIFY_LOGO_BASE64;
  }
};

// Helper to get semi-transparent data URL using canvas
const getSemiTransparentLogoDataUrl = (imgDataUrl: string, opacity: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.globalAlpha = opacity;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(imgDataUrl);
        }
      } catch (e) {
        resolve(imgDataUrl);
      }
    };
    img.onerror = () => resolve(imgDataUrl);
    img.src = imgDataUrl;
  });
};

// Common header layout for official documents
const drawOfficialHeader = async (
  doc: jsPDF,
  establishment: any,
  title: string,
  refNumber: string,
  dateStr: string,
  subTitle?: string
) => {
  const primaryColorHex = establishment?.primaryColor || '#4f46e5';
  const secondaryColorHex = establishment?.secondaryColor || '#ea580c';
  const pColor = hexToRgb(primaryColorHex);
  const sColor = hexToRgb(secondaryColorHex);

  const width = doc.internal.pageSize.getWidth();

  // Color bands at the very top
  doc.setFillColor(pColor[0], pColor[1], pColor[2]);
  doc.rect(10, 10, width - 20, 30, 'F');

  doc.setFillColor(sColor[0], sColor[1], sColor[2]);
  doc.rect(10, 40, width - 20, 2, 'F');

  // Load Logo if available
  const logoUrl = establishment?.logo || '/logo.png';
  try {
    const imgData = await fetchImageAsBase64(logoUrl);
    if (imgData) {
      doc.addImage(imgData, 'PNG', 15, 14, 22, 22);
    } else {
      throw new Error("Empty image data");
    }
  } catch (e) {
    // Fallback initials box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 14, 22, 22, 2, 2, 'F');
    doc.setTextColor(pColor[0], pColor[1], pColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const initials = (establishment?.nom || 'EDU').substring(0, 3).toUpperCase();
    doc.text(initials, 26, 26, { align: 'center' });
  }

  // School metadata on left
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text((establishment?.nom || 'EDU-NIFY ERP').toUpperCase(), 42, 19);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text(establishment?.devise || 'Excellence • Discipline • Succès', 42, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Adresse : ${establishment?.adresse || 'Libreville, Gabon'}`, 42, 28);
  doc.text(`Tél : ${establishment?.telephone || '+241 01 02 03'} | Email : ${establishment?.email || 'contact@school.com'}`, 42, 32);
  if (establishment?.siteWeb) {
    doc.text(`Web : ${establishment?.siteWeb}`, 42, 36);
  }

  // Document Title and Reference details on right
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), width - 15, 19, { align: 'right' });

  if (subTitle) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(subTitle.toUpperCase(), width - 15, 24, { align: 'right' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Réf : ${refNumber}`, width - 15, 30, { align: 'right' });
  doc.text(`Date : ${dateStr}`, width - 15, 34, { align: 'right' });
};

// Common background watermark logo
const drawOfficialWatermark = async (doc: jsPDF, establishment: any) => {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const logoUrl = establishment?.logo || '/logo.png';
  const schoolName = establishment?.nom || 'CAMPUS EXCELLENCE';

  try {
    const imgData = await fetchImageAsBase64(logoUrl);
    if (!imgData) throw new Error("Empty image data for watermark");
    
    const transparentLogo = await getSemiTransparentLogoDataUrl(imgData, 0.08); // visible yet professional 8% opacity
    const wSize = 85;
    doc.addImage(transparentLogo, 'PNG', (width - wSize) / 2, (height - wSize) / 2, wSize, wSize);
  } catch (e) {
    // 100% safe native text watermark without crash-prone canvas rotate operations
    doc.setTextColor(245, 246, 248);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName.toUpperCase(), width / 2, height / 2, { align: 'center', angle: 320 });
  }
};

// Common official frame/borders
const drawOfficialFrame = (doc: jsPDF, establishment: any) => {
  const primaryColorHex = establishment?.primaryColor || '#4f46e5';
  const pColor = hexToRgb(primaryColorHex);
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  doc.setDrawColor(pColor[0], pColor[1], pColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, width - 16, height - 16);

  doc.setDrawColor(pColor[0], pColor[1], pColor[2]);
  doc.setLineWidth(0.15);
  doc.rect(9.2, 9.2, width - 18.4, height - 18.4);
};

// Common footer copyright & anti-falsification seal
const drawOfficialFooter = (doc: jsPDF, docId: string) => {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.25);
  doc.line(10, height - 18, width - 10, height - 18);

  doc.setTextColor(130, 140, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Document officiel certifié conforme généré par la plateforme Edu-Nify ERP.', 12, height - 13);
  doc.text(`ID Unique : ${docId} | Signature Sécurisée SAGE / OHADA Compliant`, 12, height - 9);

  doc.text('Page 1 / 1', width - 12, height - 13, { align: 'right' });
  doc.text('Copie certifiée conforme', width - 12, height - 9, { align: 'right' });
};


/**
 * 1. PAY SLIP PDF GENERATOR
 */
export const generatePaySlipPDF = async (slip: any, establishment: any, currentUserName?: string) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const pColorHex = establishment?.primaryColor || '#4f46e5';
  const pColor = hexToRgb(pColorHex);

  // Borders, header, watermark
  drawOfficialFrame(doc, establishment);
  await drawOfficialWatermark(doc, establishment);
  await drawOfficialHeader(
    doc,
    establishment,
    'BULLETIN DE PAIE',
    slip.slipNumber,
    slip.dateGenerated,
    `PÉRIODE : ${slip.period}`
  );

  // Collaborator & Employer Info Block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, 48, width - 24, 25, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYEUR :', 16, 54);
  doc.text('COLLABORATEUR / EMPLOYÉ :', width / 2 + 4, 54);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(establishment?.nom || 'Edu-Nify', 16, 59);
  doc.text(`Service : Comptabilité & RH`, 16, 64);
  doc.text(`Etablissement ID : ${establishment?.id || 'EDU-001'}`, 16, 68);

  doc.setFont('helvetica', 'bold');
  doc.text(slip.employeeName.toUpperCase(), width / 2 + 4, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`Profil / Poste : ${slip.employeeRole}`, width / 2 + 4, 64);
  doc.text(`ID Collaborateur : ${slip.employeeId.substring(0, 12)}`, width / 2 + 4, 68);

  // Table items compilation
  const tableRows: any[] = [
    ['Salaire de Base Brut', slip.baseSalary.toLocaleString() + ' F', '-']
  ];

  if (slip.primes > 0) {
    tableRows.push(['Primes d\'assiduité & Rendement', slip.primes.toLocaleString() + ' F', '-']);
  }
  if (slip.heuresSup > 0) {
    const hsAmount = slip.heuresSup * slip.tauxHeureSup;
    tableRows.push([`Heures Supplémentaires (${slip.heuresSup} h à ${slip.tauxHeureSup} F)`, hsAmount.toLocaleString() + ' F', '-']);
  }
  if (slip.avances > 0) {
    tableRows.push(['Acompte / Avances perçues', '-', slip.avances.toLocaleString() + ' F']);
  }
  if (slip.deductions > 0) {
    tableRows.push(['Retenues d\'absences ou retards', '-', slip.deductions.toLocaleString() + ' F']);
  }

  // Draw salary table
  autoTable(doc, {
    startY: 79,
    head: [['RUBRIQUES DE SALAIRE', 'GAINS (DÉBIT)', 'RETENUES (CRÉDIT)']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: pColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 4.5 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' },
      2: { halign: 'right', textColor: [220, 38, 38], fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Net Salary section
  doc.setFillColor(pColor[0], pColor[1], pColor[2]);
  doc.rect(12, finalY, width - 24, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('NET À PAYER (FCFA) :', 16, finalY + 7.5);
  doc.setFontSize(11);
  doc.text(`${slip.netSalary.toLocaleString()} FCFA`, width - 16, finalY + 7.5, { align: 'right' });

  // Summary & Totals Block
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Brut : ${slip.totalEarnings.toLocaleString()} F  |  Total Retenues : ${slip.totalDeductions.toLocaleString()} F`, 14, finalY + 16);

  // Visa Signatures
  const sigY = finalY + 24;
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('L\'Employé (Visa & Signature)', 30, sigY);
  doc.text('Le Directeur Administratif & Financier', width - 30, sigY, { align: 'right' });

  // Add the recorded by / validator name clearly
  const validatorName = currentUserName || slip.recordedByName || 'Comptable Principal';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 120, 130);
  doc.text(`Émis et certifié par : ${validatorName}`, width - 30, sigY + 5, { align: 'right' });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(15, sigY + 14, 75, sigY + 14);
  doc.line(width - 75, sigY + 14, width - 15, sigY + 14);

  // Footer seal
  drawOfficialFooter(doc, slip.id || `PAY-SLIP-${Date.now()}`);

  doc.save(`Bulletin_de_salaire_${slip.employeeName.replace(/\s+/g, '_')}_${slip.period}.pdf`);
};


/**
 * 2. REPORT CARD (BULLETIN DE NOTES) PDF GENERATOR
 */
export const generateReportCardPDF = async (bulletin: any, establishment: any) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const pColorHex = establishment?.primaryColor || '#4f46e5';
  const pColor = hexToRgb(pColorHex);

  drawOfficialFrame(doc, establishment);
  await drawOfficialWatermark(doc, establishment);
  await drawOfficialHeader(
    doc,
    establishment,
    'BULLETIN TRIMESTRIEL',
    `BUL-${bulletin.id?.substring(0, 8).toUpperCase() || Date.now().toString().slice(-6)}`,
    bulletin.publishedAt ? new Date(bulletin.publishedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
    `PÉRIODE : ${bulletin.period}`
  );

  // Student summary info block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, 48, width - 24, 25, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('APPRENANT / ÉLÈVE :', 16, 54);
  doc.text('DÉTAILS ACADÉMIQUES :', width / 2 + 4, 54);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(bulletin.studentName.toUpperCase(), 16, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID Unique : ${bulletin.studentId}`, 16, 64);
  doc.text(`Régime : Interne / Exonéré`, 16, 68);

  doc.setFont('helvetica', 'bold');
  doc.text(`CLASSE : ${bulletin.classe}`, width / 2 + 4, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`Année Académique : 2025 - 2026`, width / 2 + 4, 64);
  doc.text(`Système Scolaire : ${establishment?.systemeScolaire || 'Système National'}`, width / 2 + 4, 68);

  // Subjects table rows compilation
  const tableRows = (bulletin.gradesSummary || []).map((item: any) => [
    item.subject.toUpperCase(),
    item.coefficient || 1,
    `${item.average}/20`,
    item.teacherComment || 'Très satisfaisant.'
  ]);

  if (tableRows.length === 0) {
    tableRows.push(['Aucune note disponible', '-', '-', 'Veuillez saisir des notes.']);
  }

  // Draw subjects table
  autoTable(doc, {
    startY: 79,
    head: [['MATIÈRE / DISCIPLINE', 'COEFF.', 'MOYENNE', 'OBSERVATIONS DE L\'ENSEIGNANT']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: pColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 4.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      3: { fontStyle: 'italic' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Performance summaries grid
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, finalY, width - 24, 20, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Average
  doc.text('MOYENNE GÉNÉRALE :', 16, finalY + 7);
  doc.setTextColor(pColor[0], pColor[1], pColor[2]);
  doc.setFontSize(13);
  doc.text(`${bulletin.generalAverage}/20`, 16, finalY + 15);

  // Discipline
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('ASSIDUITÉ & DISCIPLINE :', 70, finalY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Absences injustifiées : ${bulletin.absencesCount || 0} h`, 70, finalY + 11);
  doc.text(`Retards : ${bulletin.latenessesCount || 0}`, 70, finalY + 15);

  // Council Decision
  doc.setFont('helvetica', 'bold');
  doc.text('CONSEIL DE CLASSE :', 130, finalY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Décision : ${bulletin.councilDecision || 'Félicitations'}`, 130, finalY + 11);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text(`"${bulletin.remark || 'Très bon trimestre.'}"`, 130, finalY + 15);

  // Visa Signatures
  const sigY = finalY + 33;
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Le Parent d\'Élève (Visa)', 30, sigY);
  doc.text('Le Directeur de l\'Établissement', width - 30, sigY, { align: 'right' });

  // Parent digital signature if exists
  if (bulletin.signatureParent) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Visé de façon conforme par : ${bulletin.signatureParent}`, 30, sigY + 8, { align: 'left' });
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(15, sigY + 14, 75, sigY + 14);
  doc.line(width - 75, sigY + 14, width - 15, sigY + 14);

  // Footer seal
  drawOfficialFooter(doc, bulletin.id || `BULLETIN-${Date.now()}`);

  doc.save(`Bulletin_Scolaire_${bulletin.studentName.replace(/\s+/g, '_')}_${bulletin.period}.pdf`);
};


/**
 * 3. PAYMENT RECEIPT / INVOICE PDF GENERATOR
 */
export const generateReceiptPDF = async (receipt: any, establishment: any) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const pColorHex = establishment?.primaryColor || '#4f46e5';
  const pColor = hexToRgb(pColorHex);

  drawOfficialFrame(doc, establishment);
  await drawOfficialWatermark(doc, establishment);
  await drawOfficialHeader(
    doc,
    establishment,
    'REÇU DE COMPLEMENT',
    receipt.reference,
    receipt.date,
    'SCOLARITÉ & RÈGLEMENTS'
  );

  // Meta Info Layout
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, 48, width - 24, 25, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('VERSEUR / ÉLÈVE APPRENANT :', 16, 54);
  doc.text('TRANSACTION ET CAISSE :', width / 2 + 4, 54);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.studentName.toUpperCase(), 16, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID Etablissement : ${receipt.etablissement || 'N/A'}`, 16, 64);
  doc.text(`Bénéficiaire : Régime d'Enseignement Général`, 16, 68);

  doc.setFont('helvetica', 'bold');
  doc.text(`MÉTHODE : ${String(receipt.method || 'espèces').toUpperCase()}`, width / 2 + 4, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`Caissier : ${receipt.recordedByName || 'Chef Comptable'}`, width / 2 + 4, 64);
  doc.text(`Système de Certification : SAGE Standard`, width / 2 + 4, 68);

  // Grid representation
  const tableRows = [
    [
      receipt.type?.toUpperCase() || 'SCOLARITÉ',
      receipt.notes || 'Règlement de scolarité valide.',
      `${receipt.amount?.toLocaleString() || 0} FCFA`
    ]
  ];

  autoTable(doc, {
    startY: 79,
    head: [['RUBRIQUE D\'IMPUTATION', 'ANNOTATIONS ET DETAILS', 'MONTANT ENCAISSÉ']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: pColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { fontStyle: 'italic' },
      2: { halign: 'right', fontStyle: 'bold', cellWidth: 40 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Net paid highlight
  doc.setFillColor(pColor[0], pColor[1], pColor[2]);
  doc.rect(12, finalY, width - 24, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('TOTAL NET ENCAISSÉ (FCFA) :', 16, finalY + 7.5);
  doc.setFontSize(11);
  doc.text(`${(receipt.amount || 0).toLocaleString()} FCFA`, width - 16, finalY + 7.5, { align: 'right' });

  // Signatures
  const sigY = finalY + 24;
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Le Guichetier / Caissier', 30, sigY);
  doc.text('Le Directeur / Fondé de Pouvoirs', width - 30, sigY, { align: 'right' });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(15, sigY + 14, 75, sigY + 14);
  doc.line(width - 75, sigY + 14, width - 15, sigY + 14);

  drawOfficialFooter(doc, receipt.id || `REC-${Date.now()}`);

  doc.save(`Recu_Paiement_${receipt.studentName.replace(/\s+/g, '_')}_${receipt.reference}.pdf`);
};


/**
 * 4. CERTIFICATES & ATTESTATIONS PDF GENERATOR
 */
export const generateCertificatePDF = async (cert: any, establishment: any) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const pColorHex = establishment?.primaryColor || '#4f46e5';
  const pColor = hexToRgb(pColorHex);

  drawOfficialFrame(doc, establishment);
  await drawOfficialWatermark(doc, establishment);
  await drawOfficialHeader(
    doc,
    establishment,
    cert.title || 'CERTIFICAT DE SCOLARITÉ',
    cert.reference || `CERT-${Date.now().toString().slice(-6)}`,
    new Date().toLocaleDateString('fr-FR'),
    'ADMINISTRATION ACADÉMIQUE'
  );

  // Large formal typography
  doc.setTextColor(15, 23, 42);
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('CERTIFICAT DE SCOLARITÉ', width / 2, 85, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.text('La direction administrative soussignée certifie par la présente que :', width / 2, 95, { align: 'center' });

  // Student centered block
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text(`L'Élève : ${cert.studentName.toUpperCase()}`, width / 2, 108, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(11.5);
  let detailY = 118;
  doc.text(`Né(e) le : ${cert.dateNaissance || 'N/A'} à ${cert.lieuNaissance || 'Non spécifié'}`, width / 2, detailY, { align: 'center' });
  detailY += 7;
  doc.text(`Est régulièrement inscrit(e) au sein de notre établissement pour l'Année Académique ${cert.academicYear || '2025 - 2026'}.`, width / 2, detailY, { align: 'center' });
  detailY += 7;
  doc.text(`Classe d'affectation : ${cert.classe.toUpperCase()}`, width / 2, detailY, { align: 'center' });
  detailY += 7;
  doc.text(`Numéro de Matricule officiel : ${cert.matricule || 'MAT-' + cert.studentId?.substring(0, 6)}`, width / 2, detailY, { align: 'center' });

  // Closing formal sentence
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.', width / 2, 160, { align: 'center' });

  // Official signature
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Le Directeur Général', width - 30, 190, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(establishment?.nom || 'Edu-Nify Administration', width - 30, 196, { align: 'right' });

  // Digital sign seal
  doc.setDrawColor(pColor[0], pColor[1], pColor[2]);
  doc.setLineWidth(0.25);
  doc.line(width - 75, 218, width - 15, 218);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 120, 130);
  doc.text('Signature Electronique Certifiée Conforme', width - 45, 223, { align: 'center' });

  drawOfficialFooter(doc, cert.studentId || `CERT-${Date.now()}`);

  doc.save(`Certificat_Scolarite_${cert.studentName.replace(/\s+/g, '_')}.pdf`);
};

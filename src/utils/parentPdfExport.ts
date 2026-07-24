import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Parent } from '../types/parent';
import { EDU_NIFY_LOGO_BASE64 } from '../lib/logo';

export function generateParentProfilePDF(parent: Parent, establishment: any) {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(79, 70, 229); // Primary Indigo
  doc.rect(0, 0, width, 24, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("FICHE RENSEIGNEMENT PARENT / RESPONSABLE LÉGAL", 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, width - 14, 15, { align: 'right' });

  let y = 35;

  // Establishment Header
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(establishment?.nom || "Établissement Scolaire Edu-Nify", 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Année Scolaire: 2025-2026 | Code: ${establishment?.id || 'EDU-NIFY'}`, 14, y);
  y += 12;

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, y, width - 14, y);
  y += 10;

  // Parent Main Info Section
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, width - 28, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text("1. INFORMATIONS PERSONNELLES", 18, y + 5.5);
  y += 14;

  const personalData = [
    ["Nom Complet", `${parent.nom.toUpperCase()} ${parent.prenom}`],
    ["Genre / Sexe", parent.sexe === 'M' ? 'Masculin (M)' : parent.sexe === 'F' ? 'Féminin (F)' : parent.sexe || 'Non renseigné'],
    ["Date de Naissance", parent.dateNaissance || 'N/A'],
    ["Nationalité", parent.nationalite || 'N/A'],
    ["Profession", parent.profession || 'Non renseignée'],
    ["Téléphone Principal", parent.telephone || 'N/A'],
    ["Téléphone Secondaire", parent.telephoneSecondaire || 'N/A'],
    ["Adresse Email", parent.email || 'N/A'],
    ["Adresse Résidence", `${parent.adresse || ''} ${parent.quartier ? '- ' + parent.quartier : ''} ${parent.ville ? '(' + parent.ville + ')' : ''}`.trim() || 'N/A'],
    ["Statut du Compte", parent.statut?.toUpperCase() || 'ACTIF'],
    ["Dernière Connexion", parent.lastLogin ? new Date(parent.lastLogin).toLocaleString('fr-FR') : 'Jamais connecté']
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: personalData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [75, 85, 99] },
      1: { textColor: [17, 24, 39] }
    },
    margin: { left: 14, right: 14 }
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Children Section
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, width - 28, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text("2. ÉLÈVES / ENFANTS ASSOCIÉS", 18, y + 5.5);
  y += 14;

  if (parent.children && parent.children.length > 0) {
    const childrenRows = parent.children.map((c: any, index: number) => [
      index + 1,
      `${c.nom || ''} ${c.prenom || ''}`.trim(),
      c.matricule || 'N/A',
      c.classe || 'N/A',
      c.relationship || 'Tuteur',
      c.enseignantPrincipal || 'N/A'
    ]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Nom & Prénom", "Matricule", "Classe", "Lien de Parenté", "Prof. Principal"]],
      body: childrenRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8.5 },
      margin: { left: 14, right: 14 }
    });
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text("Aucun enfant associé à ce compte pour le moment.", 14, y);
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text(`Document Officiel Edu-Nify — Page ${i} sur ${pageCount}`, width / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`Fiche_Parent_${parent.nom}_${parent.prenom}.pdf`);
}

export function generateParentsListPDF(parents: Parent[], establishment: any) {
  const doc = new jsPDF('landscape');
  const width = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, width, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`RÉPERTOIRE DES PARENTS ET RESPONSABLES LÉGAUX — ${establishment?.nom || 'Edu-Nify'}`, 14, 14);

  let y = 30;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Effectif Total: ${parents.length} parents | Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, y);
  y += 8;

  const rows = parents.map((p, index) => [
    index + 1,
    `${p.nom.toUpperCase()} ${p.prenom}`,
    p.telephone,
    p.email,
    p.profession || 'N/A',
    p.children?.length || p.childrenIds?.length || 0,
    p.classes?.join(', ') || 'N/A',
    p.statut.toUpperCase()
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Nom & Prénom", "Téléphone", "Email", "Profession", "Enfants", "Classes", "Statut"]],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 }
  });

  doc.save(`Directory_Parents_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportParentsExcelCSV(parents: Parent[], format: 'excel' | 'csv') {
  const headers = ["Nom", "Prénom", "Sexe", "Téléphone", "Téléphone Secondaire", "Email", "Profession", "Adresse", "Ville", "Nb Enfants", "Classes", "Statut"];
  const rows = parents.map(p => [
    `"${p.nom}"`,
    `"${p.prenom}"`,
    `"${p.sexe || ''}"`,
    `"${p.telephone}"`,
    `"${p.telephoneSecondaire || ''}"`,
    `"${p.email}"`,
    `"${p.profession || ''}"`,
    `"${p.adresse || ''}"`,
    `"${p.ville || ''}"`,
    p.children?.length || p.childrenIds?.length || 0,
    `"${p.classes?.join('; ') || ''}"`,
    `"${p.statut}"`
  ]);

  const content = [headers.join(format === 'csv' ? ',' : '\t'), ...rows.map(r => r.join(format === 'csv' ? ',' : '\t'))].join('\n');
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel;charset=utf-8;';
  const fileName = `Export_Parents_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`;

  const blob = new Blob(["\ufeff" + content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

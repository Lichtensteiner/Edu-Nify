/**
 * Helper to determine automatic school coefficients in real-time
 * based on the Educational System, Subject, and Class/Level.
 * Specially tailored for Gabonese, French, Canadian, and Bilingue schools.
 */

export interface CoefficientRuleParams {
  systemeScolaire: string;
  subject: string;
  className: string;
  evaluationType?: 'interrogation' | 'evaluation' | string;
}

export function getAutomaticCoefficient({
  systemeScolaire,
  subject,
  className,
  evaluationType = 'evaluation'
}: CoefficientRuleParams): number {
  const sys = (systemeScolaire || 'Système Français').toLowerCase();
  const sub = (subject || '').trim().toLowerCase();
  const cls = (className || '').trim().toUpperCase();

  // Primary multiplier: general quizzes (interrogations) usually have a lower coefficient (often halved or set to 1)
  const isInterro = evaluationType.toLowerCase() === 'interrogation';

  // Helper to identify class groups
  const isLycée = cls.includes('LYCEE') || cls.includes('TERM') || cls.includes('1ERE') || cls.includes('1ÈRE') || cls.includes('2NDE') || cls.includes('SEC') || /^[21T]\s*[A-Z0-9]/i.test(cls);
  const isCollege = cls.includes('COLL') || cls.includes('6EME') || cls.includes('6È') || cls.includes('5EME') || cls.includes('5È') || cls.includes('4EME') || cls.includes('4È') || cls.includes('3EME') || cls.includes('3È') || /^[6543]\s*[A-Z]/i.test(cls);
  const isPrimaire = cls.includes('PRIM') || cls.includes('CP') || cls.includes('CE') || cls.includes('CM') || cls.includes('MAT');

  // Let's identify the series/specialty for Lycée (especially critical for Gabon and France)
  let series = 'Général';
  if (isLycée) {
    if (cls.includes('A1') || cls.includes('SERIE A1')) series = 'A1';
    else if (cls.includes('A2') || cls.includes('SERIE A2')) series = 'A2';
    else if (cls.includes('A') || cls.includes('LITTÉRAIRE')) series = 'A';
    else if (cls.includes('C') || cls.includes('SERIE C') || cls.includes('MATH')) series = 'C';
    else if (cls.includes('D') || cls.includes('SERIE D') || cls.includes('SVT')) series = 'D';
    else if (cls.includes('B') || cls.includes('SERIE B') || cls.includes('SES') || cls.includes('ECO')) series = 'B';
    else if (cls.includes('G') || cls.includes('SERIE G') || cls.includes('TERT') || cls.includes('GESTION')) series = 'G';
    else if (cls.includes('TI') || cls.includes('TECH')) series = 'TI';
  }

  // --- 1. SYSTEME GABONAIS (PUBLIC & PRIVE) ---
  if (sys.includes('gabonais') || sys.includes('conventionnée') || sys.includes('conventionnee')) {
    // Primaire Gabonais
    if (isPrimaire) {
      if (sub.includes('math') || sub.includes('calcul')) return isInterro ? 2 : 5;
      if (sub.includes('fran') || sub.includes('lect') || sub.includes('orth') || sub.includes('gram')) return isInterro ? 2 : 5;
      if (sub.includes('eveil') || sub.includes('scien') || sub.includes('hist') || sub.includes('géo')) return isInterro ? 1 : 2;
      if (sub.includes('eps') || sub.includes('sport')) return 1;
      return 1;
    }

    // Lycée Gabonais (Séries Officielles du Baccalauréat)
    if (isLycée) {
      switch (series) {
        case 'C': // Scientifique pur (Maths / Physiques)
          if (sub.includes('math')) return isInterro ? 3 : 6;
          if (sub.includes('phys') || sub.includes('chim')) return isInterro ? 2.5 : 5;
          if (sub.includes('svt') || sub.includes('biol')) return isInterro ? 1 : 2;
          if (sub.includes('philo')) return isInterro ? 1 : 2;
          if (sub.includes('fran')) return isInterro ? 1 : 2;
          if (sub.includes('ang') || sub.includes('all') || sub.includes('esp') || sub.includes('lang')) return isInterro ? 1 : 2;
          if (sub.includes('hist') || sub.includes('géo')) return isInterro ? 1 : 2;
          break;

        case 'D': // Scientifique (Sciences de la vie / SVT)
          if (sub.includes('svt') || sub.includes('biol')) return isInterro ? 2.5 : 5;
          if (sub.includes('math')) return isInterro ? 2 : 4;
          if (sub.includes('phys') || sub.includes('chim')) return isInterro ? 2 : 4;
          if (sub.includes('fran')) return isInterro ? 1 : 2;
          if (sub.includes('philo')) return isInterro ? 1 : 2;
          if (sub.includes('ang') || sub.includes('all') || sub.includes('esp') || sub.includes('lang')) return isInterro ? 1 : 2;
          if (sub.includes('hist') || sub.includes('géo')) return isInterro ? 1 : 2;
          break;

        case 'A1': // Littéraire (Latin / Grec)
          if (sub.includes('fran')) return isInterro ? 2.5 : 5;
          if (sub.includes('philo')) return isInterro ? 2.5 : 5;
          if (sub.includes('ang') || sub.includes('all') || sub.includes('esp') || sub.includes('lang')) return isInterro ? 2 : 4;
          if (sub.includes('hist') || sub.includes('géo')) return isInterro ? 2 : 4;
          if (sub.includes('math')) return isInterro ? 1 : 2;
          if (sub.includes('phys') || sub.includes('chim') || sub.includes('svt')) return isInterro ? 0.5 : 1;
          break;

        case 'A2': // Littéraire (Langues)
          if (sub.includes('fran')) return isInterro ? 2.5 : 5;
          if (sub.includes('philo')) return isInterro ? 2.5 : 5;
          if (sub.includes('ang') || sub.includes('all') || sub.includes('esp') || sub.includes('lang')) return isInterro ? 2.5 : 5;
          if (sub.includes('hist') || sub.includes('géo')) return isInterro ? 2 : 4;
          if (sub.includes('math')) return isInterro ? 1 : 2;
          break;

        case 'B': // Économique
          if (sub.includes('math')) return isInterro ? 2 : 4;
          if (sub.includes('fran')) return isInterro ? 1.5 : 3;
          if (sub.includes('philo')) return isInterro ? 1.5 : 3;
          if (sub.includes('hist') || sub.includes('géo')) return isInterro ? 2 : 4;
          if (sub.includes('ang') || sub.includes('all') || sub.includes('esp')) return isInterro ? 1.5 : 3;
          if (sub.includes('svt') || sub.includes('phys')) return isInterro ? 1 : 2;
          if (sub.includes('eco') || sub.includes('soc')) return isInterro ? 2.5 : 5;
          break;

        case 'G': // Tertiaire (Gestion / Secrétariat / Compta)
          if (sub.includes('compta') || sub.includes('gest') || sub.includes('droit') || sub.includes('secr')) return isInterro ? 3 : 6;
          if (sub.includes('math')) return isInterro ? 1.5 : 3;
          if (sub.includes('fran')) return isInterro ? 1.5 : 3;
          if (sub.includes('ang') || sub.includes('lang')) return isInterro ? 1.5 : 3;
          if (sub.includes('philo')) return isInterro ? 1 : 2;
          break;

        case 'TI': // Technologies de l'Information
          if (sub.includes('informatique') || sub.includes('algo') || sub.includes('program') || sub.includes('ti')) return isInterro ? 3 : 6;
          if (sub.includes('math')) return isInterro ? 2 : 4;
          if (sub.includes('phys') || sub.includes('chim')) return isInterro ? 2 : 4;
          if (sub.includes('fran')) return isInterro ? 1 : 2;
          break;

        default: // Lycée Général Gabonais standard par défaut
          if (sub.includes('math')) return isInterro ? 2 : 4;
          if (sub.includes('fran')) return isInterro ? 2 : 4;
          if (sub.includes('phys') || sub.includes('chim')) return isInterro ? 1.5 : 3;
          if (sub.includes('svt') || sub.includes('biol')) return isInterro ? 1.5 : 3;
          if (sub.includes('ang') || sub.includes('all') || sub.includes('esp')) return isInterro ? 1.5 : 3;
          if (sub.includes('hist') || sub.includes('géo')) return isInterro ? 1.5 : 3;
          if (sub.includes('philo')) return isInterro ? 1 : 2;
          break;
      }

      // Fallback Lycée general core rules
      if (sub.includes('eps') || sub.includes('sport')) return 2;
      if (sub.includes('dessin') || sub.includes('art') || sub.includes('musi') || sub.includes('informatique')) return 1;
      return isInterro ? 1 : 2;
    }

    // Collège Gabonais (6ème, 5ème, 4ème, 3ème)
    // Au Gabon, au collège, le Français et les Mathématiques ont des coefficients majeurs
    if (sub.includes('fran')) return isInterro ? 2.5 : 5;
    if (sub.includes('math')) return isInterro ? 2 : 4;
    if (sub.includes('ang') || sub.includes('lang')) return isInterro ? 1.5 : 3;
    if (sub.includes('hist') || sub.includes('géo') || sub.includes('h-g')) return isInterro ? 1.5 : 3;
    if (sub.includes('phys') || sub.includes('chim')) {
      // 6ème/5ème pas de physique ou coefficient 1/2, 4ème/3ème coef 3
      if (cls.includes('6EME') || cls.includes('6È') || cls.includes('5EME') || cls.includes('5È')) return isInterro ? 0.5 : 1;
      return isInterro ? 1.5 : 3;
    }
    if (sub.includes('svt') || sub.includes('biol') || sub.includes('sciences de la vie')) return isInterro ? 1 : 2;
    if (sub.includes('eps') || sub.includes('sport')) return 2;
    if (sub.includes('informatique') || sub.includes('techno') || sub.includes('art') || sub.includes('musi')) return 1;

    return isInterro ? 1 : 2;
  }

  // --- 2. SYSTEME FRANCAIS (AEFE) ---
  if (sys.includes('français') || sys.includes('francais')) {
    if (isPrimaire) {
      if (sub.includes('math')) return isInterro ? 1 : 3;
      if (sub.includes('fran')) return isInterro ? 1 : 4;
      return 1;
    }

    if (isLycée) {
      // Traditional French streams/specialties
      if (series === 'C' || cls.includes('SPE MATH') || cls.includes('SCIENTIFIQUE')) {
        if (sub.includes('math')) return isInterro ? 4 : 8;
        if (sub.includes('phys') || sub.includes('chim')) return isInterro ? 3 : 6;
        if (sub.includes('svt')) return isInterro ? 3 : 6;
      } else if (series === 'A' || cls.includes('LITTÉRAIRE') || cls.includes('SPE HLP')) {
        if (sub.includes('philo')) return isInterro ? 4 : 8;
        if (sub.includes('fran')) return isInterro ? 2.5 : 5;
        if (sub.includes('ang') || sub.includes('all') || sub.includes('esp')) return isInterro ? 2 : 4;
      } else if (series === 'B' || cls.includes('SPE SES') || cls.includes('ECONOMIQUE')) {
        if (sub.includes('eco') || sub.includes('soc') || sub.includes('ses')) return isInterro ? 3.5 : 7;
        if (sub.includes('math')) return isInterro ? 2.5 : 5;
      }

      // Tronc commun AEFE general weights
      if (sub.includes('fran')) return isInterro ? 2.5 : 5;
      if (sub.includes('philo')) return isInterro ? 2 : 4;
      if (sub.includes('hist') || sub.includes('géo') || sub.includes('h-g')) return isInterro ? 1.5 : 3;
      if (sub.includes('ang') || sub.includes('all') || sub.includes('esp')) return isInterro ? 1.5 : 3;
      if (sub.includes('scientifique') || sub.includes('ens. sci')) return 2;
      if (sub.includes('eps')) return 2;
      return isInterro ? 1 : 2;
    }

    // Collège Français Standard
    if (sub.includes('math')) return isInterro ? 2 : 4;
    if (sub.includes('fran')) return isInterro ? 2 : 4;
    if (sub.includes('hist') || sub.includes('géo') || sub.includes('h-g')) return isInterro ? 1.5 : 3;
    if (sub.includes('ang') || sub.includes('lv1')) return isInterro ? 1.5 : 3;
    if (sub.includes('lv2') || sub.includes('esp') || sub.includes('all')) return isInterro ? 1 : 2;
    if (sub.includes('phys') || sub.includes('chim') || sub.includes('svt') || sub.includes('techno')) return isInterro ? 1 : 2;
    if (sub.includes('eps')) return 2;
    return 1;
  }

  // --- 3. SYSTEME FRANCO-CANADIEN ---
  if (sys.includes('canadien')) {
    // Canada works primarily with equal credit weights or standard defaults
    if (sub.includes('math') || sub.includes('fran') || sub.includes('ang') || sub.includes('scien')) {
      return isInterro ? 1 : 2;
    }
    return 1;
  }

  // --- 4. ECOLE BILINGUE / INTERNATIONAL (IB / CAMBRIDGE) ---
  if (sys.includes('bilingue') || sys.includes('anglo') || sys.includes('internat')) {
    // Standard international weights
    if (sub.includes('math') || sub.includes('english') || sub.includes('anglais') || sub.includes('scien') || sub.includes('physic')) {
      return isInterro ? 1.5 : 3;
    }
    if (sub.includes('history') || sub.includes('geography') || sub.includes('hist') || sub.includes('géo')) {
      return isInterro ? 1 : 2;
    }
    return isInterro ? 1 : 2;
  }

  // --- 5. DEFAULT STANDARDS ---
  if (sub.includes('math') || sub.includes('fran') || sub.includes('calcul')) return isInterro ? 1.5 : 3;
  if (sub.includes('phys') || sub.includes('chim') || sub.includes('svt') || sub.includes('biol')) return isInterro ? 1 : 2;
  if (sub.includes('ang') || sub.includes('hist') || sub.includes('géo')) return isInterro ? 1 : 2;
  
  return isInterro ? 1 : 1.5;
}

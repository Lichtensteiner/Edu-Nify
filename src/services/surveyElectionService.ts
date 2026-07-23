import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  arrayUnion, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { 
  Survey, 
  SurveyResponse, 
  Election, 
  Candidate, 
  ElectionVote, 
  Question 
} from '../types/surveyElection';
import { recordAuditLog } from './auditService';
import { moveToTrash } from './trashService';

// ==========================================
// SURVEYS SERVICES
// ==========================================

export const subscribeToSurveys = (callback: (surveys: Survey[]) => void) => {
  const q = query(collection(db, 'surveys'));
  return onSnapshot(q, (snapshot) => {
    const surveys = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Survey[];
    // Filter out soft deleted
    callback(surveys.filter(s => !s.softDeleted));
  }, (err) => {
    console.error("Error subscribing to surveys:", err);
  });
};

export const subscribeToSurveyResponses = (surveyId: string, callback: (responses: SurveyResponse[]) => void) => {
  const q = query(collection(db, 'surveyResponses'), where('surveyId', '==', surveyId));
  return onSnapshot(q, (snapshot) => {
    const responses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SurveyResponse[];
    callback(responses);
  }, (err) => {
    console.error("Error subscribing to survey responses:", err);
  });
};

export const createSurvey = async (surveyData: Omit<Survey, 'id' | 'createdAt' | 'votersCount' | 'voterIds'>, currentUser: any) => {
  try {
    const payload = {
      ...surveyData,
      votersCount: 0,
      voterIds: [],
      status: surveyData.status || 'active',
      softDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'surveys'), payload);

    if (currentUser) {
      await recordAuditLog({
        userId: currentUser.id || currentUser.uid,
        userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || 'Utilisateur',
        userRole: currentUser.role || 'admin',
        action: 'Création de sondage',
        details: `Titre: ${surveyData.title}, Catégorie: ${surveyData.category}`,
        category: 'management'
      });
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'surveys');
    throw error;
  }
};

export const updateSurvey = async (id: string, updates: Partial<Survey>, currentUser: any) => {
  try {
    const docRef = doc(db, 'surveys', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    if (currentUser) {
      await recordAuditLog({
        userId: currentUser.id || currentUser.uid,
        userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
        userRole: currentUser.role,
        action: 'Mise à jour de sondage',
        details: `Sondage ID: ${id}`,
        category: 'management'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `surveys/${id}`);
    throw error;
  }
};

export const softDeleteSurvey = async (survey: Survey, currentUser: any) => {
  try {
    await moveToTrash({
      type: 'news',
      title: `Sondage: ${survey.title}`,
      content: survey.description,
      originalCollection: 'surveys',
      originalId: survey.id,
      deletedBy: currentUser?.id || currentUser?.uid || 'system',
      deletedByName: `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim(),
      data: survey
    });

    const docRef = doc(db, 'surveys', survey.id);
    await updateDoc(docRef, {
      softDeleted: true,
      updatedAt: serverTimestamp()
    });

    if (currentUser) {
      await recordAuditLog({
        userId: currentUser.id || currentUser.uid,
        userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
        userRole: currentUser.role,
        action: 'Suppression (Corbeille) sondage',
        details: `Titre: ${survey.title}`,
        category: 'management'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `surveys/${survey.id}`);
    throw error;
  }
};

export const archiveSurvey = async (id: string, currentUser: any) => {
  try {
    const docRef = doc(db, 'surveys', id);
    await updateDoc(docRef, {
      status: 'archived',
      updatedAt: serverTimestamp()
    });

    if (currentUser) {
      await recordAuditLog({
        userId: currentUser.id || currentUser.uid,
        userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
        userRole: currentUser.role,
        action: 'Archivage de sondage',
        details: `Sondage ID: ${id}`,
        category: 'management'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `surveys/${id}`);
    throw error;
  }
};

export const duplicateSurvey = async (survey: Survey, currentUser: any) => {
  const newTitle = `${survey.title} (Copie)`;
  const { id, createdAt, updatedAt, voterIds, votersCount, ...rest } = survey;
  return createSurvey({
    ...rest,
    title: newTitle,
    status: 'draft'
  }, currentUser);
};

export const submitSurveyResponse = async (
  survey: Survey,
  userId: string,
  userName: string,
  userRole: string,
  answers: Record<string, any>
) => {
  try {
    // Prevent double response if not allowed
    if (!survey.settings.allowSingleResponse === false && survey.voterIds.includes(userId)) {
      throw new Error("Vous avez déjà répondu à ce sondage.");
    }

    const responsePayload: Omit<SurveyResponse, 'id'> = {
      surveyId: survey.id,
      userId,
      userName: survey.settings.isAnonymous ? 'Anonyme' : userName,
      userRole,
      answers,
      votedAt: serverTimestamp(),
      isAnonymous: survey.settings.isAnonymous
    };

    await addDoc(collection(db, 'surveyResponses'), responsePayload);

    // Update survey voter list & count
    const surveyRef = doc(db, 'surveys', survey.id);
    await updateDoc(surveyRef, {
      voterIds: arrayUnion(userId),
      votersCount: increment(1),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'surveyResponses');
    throw error;
  }
};

// ==========================================
// ELECTIONS SERVICES
// ==========================================

export const subscribeToElections = (callback: (elections: Election[]) => void) => {
  const q = query(collection(db, 'elections'));
  return onSnapshot(q, (snapshot) => {
    const elections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Election[];
    callback(elections.filter(e => !e.softDeleted));
  }, (err) => {
    console.error("Error subscribing to elections:", err);
  });
};

export const subscribeToCandidates = (electionId: string, callback: (candidates: Candidate[]) => void) => {
  const q = query(collection(db, 'candidates'), where('electionId', '==', electionId));
  return onSnapshot(q, (snapshot) => {
    const candidates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Candidate[];
    callback(candidates.sort((a, b) => (a.number || 0) - (b.number || 0)));
  }, (err) => {
    console.error("Error subscribing to candidates:", err);
  });
};

export const createElection = async (electionData: Omit<Election, 'id' | 'createdAt' | 'totalVotes' | 'voterIds'>, currentUser: any) => {
  try {
    const payload = {
      ...electionData,
      totalVotes: 0,
      voterIds: [],
      status: electionData.status || 'active',
      softDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'elections'), payload);

    if (currentUser) {
      await recordAuditLog({
        userId: currentUser.id || currentUser.uid,
        userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
        userRole: currentUser.role,
        action: 'Création d\'élection',
        details: `Titre: ${electionData.title}, Type: ${electionData.type}`,
        category: 'management'
      });
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'elections');
    throw error;
  }
};

export const updateElection = async (id: string, updates: Partial<Election>, currentUser: any) => {
  try {
    const docRef = doc(db, 'elections', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    if (currentUser) {
      await recordAuditLog({
        userId: currentUser.id || currentUser.uid,
        userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
        userRole: currentUser.role,
        action: 'Mise à jour d\'élection',
        details: `Élection ID: ${id}`,
        category: 'management'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `elections/${id}`);
    throw error;
  }
};

export const addCandidate = async (candidateData: Omit<Candidate, 'id' | 'votesCount'>, currentUser: any) => {
  try {
    const payload = {
      ...candidateData,
      votesCount: 0,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'candidates'), payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'candidates');
    throw error;
  }
};

export const updateCandidate = async (id: string, updates: Partial<Candidate>) => {
  try {
    const docRef = doc(db, 'candidates', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `candidates/${id}`);
    throw error;
  }
};

export const deleteCandidate = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'candidates', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `candidates/${id}`);
    throw error;
  }
};

export const castElectionVote = async (
  election: Election,
  candidateId: string,
  voterId: string,
  voterRole: string,
  currentUser: any
) => {
  try {
    if (election.voterIds.includes(voterId)) {
      throw new Error("Vous avez déjà voté pour cette élection.");
    }

    // 1. Record vote in votes collection
    await addDoc(collection(db, 'votes'), {
      electionId: election.id,
      candidateId,
      voterId,
      voterRole,
      votedAt: serverTimestamp(),
      isEncrypted: true
    });

    // 2. Increment candidate votes count
    const candidateRef = doc(db, 'candidates', candidateId);
    await updateDoc(candidateRef, {
      votesCount: increment(1)
    });

    // 3. Update election total votes & voter list
    const electionRef = doc(db, 'elections', election.id);
    await updateDoc(electionRef, {
      voterIds: arrayUnion(voterId),
      totalVotes: increment(1),
      updatedAt: serverTimestamp()
    });

    if (currentUser) {
      await recordAuditLog({
        userId: currentUser.id || currentUser.uid,
        userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
        userRole: currentUser.role,
        action: 'Vote élection',
        details: `Élection: ${election.title}`,
        category: 'management'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'votes');
    throw error;
  }
};

export const softDeleteElection = async (election: Election, currentUser: any) => {
  try {
    await moveToTrash({
      type: 'news',
      title: `Élection: ${election.title}`,
      content: election.description,
      originalCollection: 'elections',
      originalId: election.id,
      deletedBy: currentUser?.id || currentUser?.uid || 'system',
      deletedByName: `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim(),
      data: election
    });

    const docRef = doc(db, 'elections', election.id);
    await updateDoc(docRef, {
      softDeleted: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `elections/${election.id}`);
    throw error;
  }
};

export const archiveElection = async (id: string, currentUser: any) => {
  try {
    const docRef = doc(db, 'elections', id);
    await updateDoc(docRef, {
      status: 'archived',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `elections/${id}`);
    throw error;
  }
};

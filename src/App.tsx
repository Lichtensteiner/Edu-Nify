import React, { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useEstablishment } from "./contexts/EstablishmentContext";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PWAPrompt from "./components/PWAPrompt";
import RecentConnections from "./pages/RecentConnections";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Grades from "./pages/Grades";
import TeacherPlanning from "./pages/TeacherPlanning";
import Homework from "./pages/Homework";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Parents from "./pages/Parents";
import Discipline from "./pages/Discipline";
import Library from "./pages/Library";
import Canteen from "./pages/Canteen";
import Clubs from "./pages/Clubs";
import Establishments from "./pages/Establishments";
import StudentDashboard from "./pages/StudentDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import DocumentGenerator from "./pages/DocumentGenerator";
import Scanner from "./pages/Scanner";
import MobileApp from "./pages/MobileApp";
import Chat from "./pages/Chat";
import Trash from "./pages/Trash";
import About from "./pages/About";
import TermsAndConditions from "./pages/TermsAndConditions";
import TechSheet from "./pages/TechSheet";
import AccessControl from "./pages/AccessControl";
import BiometricRegistration from "./pages/BiometricRegistration";
import KioskMode from "./pages/KioskMode";
import Houses from "./pages/Houses";
import AIAssistant from "./pages/AIAssistant";
import LudoAIPlus from "./pages/LudoAIPlus";
import IntegrationCode from "./pages/IntegrationCode";
import Profile from "./pages/Profile";
import StrategicOptimizations from "./pages/StrategicOptimizations";
import CoursesSubjects from "./pages/CoursesSubjects";
import ResponsibilityZones from "./pages/ResponsibilityZones";
import StudentCard from "./pages/StudentCard";
import Leaderboard from "./pages/Leaderboard";
import NewsFeed from "./pages/NewsFeed";
import DigitalBinder from "./pages/DigitalBinder";
import Staff from "./pages/Staff";
import DossiersAgents from "./pages/DossiersAgents";
import CanteenDashboard from "./pages/CanteenDashboard";
import Finance from "./pages/Finance";
import AuditLogs from "./pages/AuditLogs";
import Surveys from "./pages/Surveys";
import Directory from "./pages/Directory";
import CalendarPage from "./pages/Calendar";
import Reports from "./pages/Reports";
import Classroom from "./pages/Classroom";
import Messaging from "./pages/Messaging";
import MaintenanceService from "./services/MaintenanceService";

export default function App() {
  const { currentUser, loading } = useAuth();
  const { currentEstablishment } = useEstablishment();
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Initialisation du service de maintenance automatique
  useEffect(() => {
    MaintenanceService.initMaintenance();
  }, []);

  // Définition de l'onglet par défaut selon le rôle
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "eleve") {
        setCurrentTab("student_dashboard");
      } else if (currentUser.role === "parent") {
        setCurrentTab("parent_dashboard");
      } else {
        setCurrentTab("dashboard");
      }
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-slate-400">
            Chargement de la plateforme...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  // Rendu de l'écran actif
  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return currentUser.role === "eleve" ? (
          <StudentDashboard />
        ) : currentUser.role === "parent" ? (
          <ParentDashboard />
        ) : (
          <Dashboard onNavigate={setCurrentTab} />
        );
      case "student_dashboard":
        return <StudentDashboard />;
      case "parent_dashboard":
        return <ParentDashboard />;
      case "attendance":
        return <Attendance />;
      case "grades":
        return <Grades />;
      case "planning":
      case "teacher_planning":
        return <TeacherPlanning />;
      case "homework":
        return <Homework />;
      case "users":
        return <Users />;
      case "parents":
        return <Parents />;
      case "discipline":
        return <Discipline />;
      case "library":
        return <Library />;
      case "canteen":
        return <Canteen />;
      case "canteen_dashboard":
        return <CanteenDashboard />;
      case "clubs":
        return <Clubs />;
      case "finance":
        return <Finance />;
      case "staff":
        return <Staff />;
      case "dossiers_agents":
        return <DossiersAgents />;
      case "establishments":
        return <Establishments />;
      case "documents":
        return <DocumentGenerator />;
      case "scanner":
        return <Scanner />;
      case "mobile_app":
        return <MobileApp />;
      case "chat":
        return <Chat />;
      case "messaging":
        return <Messaging />;
      case "trash":
        return <Trash />;
      case "about":
        return <About />;
      case "terms":
        return <TermsAndConditions />;
      case "tech_sheet":
        return <TechSheet />;
      case "access_control":
        return <AccessControl />;
      case "biometric":
        return <BiometricRegistration />;
      case "kiosk":
        return <KioskMode />;
      case "houses":
        return <Houses />;
      case "ai_assistant":
        return <AIAssistant />;
      case "ludo_ai_plus":
        return <LudoAIPlus />;
      case "integration_code":
        return <IntegrationCode />;
      case "profile":
        return <Profile />;
      case "optimizations":
        return <StrategicOptimizations />;
      case "courses_subjects":
        return <CoursesSubjects />;
      case "zones":
        return <ResponsibilityZones />;
      case "student_card":
        return <StudentCard />;
      case "leaderboard":
        return <Leaderboard />;
      case "news_feed":
        return <NewsFeed />;
      case "digital_binder":
        return <DigitalBinder />;
      case "audit_logs":
        return <AuditLogs />;
      case "surveys":
        return <Surveys />;
      case "directory":
        return <Directory />;
      case "calendar":
        return <CalendarPage />;
      case "reports":
        return <Reports />;
      case "classroom":
        return <Classroom />;
      case "recent_connections":
        return <RecentConnections />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <PWAPrompt />
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onNavigate={setCurrentTab}
          currentTab={currentTab}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

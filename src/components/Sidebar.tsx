import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CalendarCheck, FileText, Settings, BookOpen, Code, LogOut, ScanLine, Smartphone, CreditCard, Trophy, ScanFace, Activity, GraduationCap, UserCircle, Castle, X, Calendar as CalendarIcon, MessageSquare, BookUser, MessageCircle, Info, Sparkles, Wallet, ShieldAlert, History, Award, ShieldCheck, Scale, Utensils, Library, Vote, FileBadge, Building2, FolderClosed, Cpu, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const { currentEstablishment, isSuperAdmin: contextIsSuperAdmin } = useEstablishment();
  const isSuperAdmin = contextIsSuperAdmin || 
                       currentUser?.email?.toLowerCase().trim() === 'martinienmvezogo@gmail.com' ||
                       currentUser?.preciseRole === 'Super Admin' ||
                       currentUser?.preciseRole === 'Super Administrateur';
  const { t, tData } = useLanguage();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.unreadCounts && data.unreadCounts[currentUser.id]) {
          const unread = Number(data.unreadCounts[currentUser.id]);
          if (!isNaN(unread)) {
            count += unread;
          }
        }
      });
      setTotalUnreadCount(count);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const categories = [
    {
      title: t('main_category'),
      items: [
        { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard, roles: ['admin', 'enseignant', 'personnel administratif', 'parent', 'cuisinier'] },
        { id: 'student_dashboard', labelKey: 'student_dashboard', icon: LayoutDashboard, roles: ['élève'] },
        { id: 'newsfeed', labelKey: 'newsfeed', icon: MessageSquare, roles: ['admin', 'enseignant', 'personnel administratif', 'élève', 'parent'] },
        { id: 'directory', labelKey: 'directory', icon: BookUser, roles: ['admin', 'enseignant', 'personnel administratif', 'élève'] },
        { id: 'messaging', labelKey: 'messaging', icon: MessageCircle, roles: ['admin', 'enseignant', 'personnel administratif', 'élève', 'parent'] },
        { id: 'profile', labelKey: 'profile', icon: UserCircle, roles: ['admin', 'enseignant', 'personnel administratif', 'élève', 'parent'] },
        { id: 'about', labelKey: 'about', icon: Info, roles: ['admin', 'enseignant', 'personnel administratif', 'élève', 'parent'] },
        { id: 'terms', labelKey: 'terms_and_conditions', icon: ShieldCheck, roles: ['admin', 'enseignant', 'personnel administratif', 'élève', 'parent'] },
      ]
    },
    {
      title: t('schooling_category'),
      items: [
        { id: 'digital_binder', labelKey: 'digital_binder', icon: FolderClosed, roles: ['admin', 'enseignant', 'élève', 'parent'] },
        { id: 'classroom', labelKey: 'classroom', icon: GraduationCap, roles: ['admin', 'enseignant', 'élève'] },
        { id: 'homework', labelKey: 'homework', icon: BookOpen, roles: ['admin', 'enseignant', 'élève', 'parent'] },
        { id: 'grades', labelKey: 'grades', icon: FileText, roles: ['admin', 'enseignant', 'élève', 'parent'] },
        { id: 'ludo_ai_plus', labelKey: 'ludo_ai_plus', icon: Sparkles, roles: ['élève', 'admin'] },
        { id: 'courses_subjects', labelKey: 'courses_subjects', icon: BookOpen, roles: ['enseignant', 'admin', 'élève', 'personnel administratif', 'cuisinier'] },
        { id: 'ai_assistant', labelKey: 'ai_assistant', icon: Sparkles, roles: ['enseignant', 'admin'] },
        { id: 'classes', labelKey: 'classes', icon: BookOpen, roles: ['admin', 'enseignant'] },
        { id: 'planning', labelKey: 'planning', icon: CalendarIcon, roles: ['admin', 'enseignant', 'élève', 'parent'] },
        { id: 'calendar', labelKey: 'calendar', icon: CalendarIcon, roles: ['admin', 'enseignant', 'personnel administratif', 'parent'] },
        { id: 'attendance', labelKey: 'attendance', icon: CalendarCheck, roles: ['admin', 'enseignant', 'personnel administratif'] },
        { id: 'reports', labelKey: 'reports', icon: FileText, roles: ['admin', 'enseignant', 'personnel administratif'] },
      ]
    },
    {
      title: t('student_life_category'),
      items: [
        { id: 'student_card', labelKey: 'student_card', icon: CreditCard, roles: ['élève'] },
        { id: 'houses', labelKey: 'houses', icon: Castle, roles: ['admin', 'enseignant', 'élève', 'parent'] },
        { id: 'clubs', labelKey: 'clubs', icon: Award, roles: ['admin', 'enseignant', 'élève', 'parent'] },
        { id: 'leaderboard', labelKey: 'leaderboard', icon: Trophy, roles: ['admin', 'enseignant', 'élève', 'parent'] },
        { id: 'library', labelKey: 'library', icon: Library, roles: ['admin', 'enseignant', 'élève', 'parent'] },
        { id: 'canteen', labelKey: 'canteen', icon: Utensils, roles: ['admin', 'enseignant', 'élève', 'parent', 'cuisinier', 'personnel administratif'] },
        { id: 'surveys', labelKey: 'surveys', icon: Vote, roles: ['admin', 'enseignant', 'élève', 'parent', 'personnel administratif', 'cuisinier'] },
      ]
    },
    {
      title: t('administration_category'),
      items: [
        { id: 'establishments', labelKey: isSuperAdmin ? 'establishments' : 'my_establishment', icon: Building2, roles: ['admin'] },
        { id: 'users', labelKey: 'users', icon: Users, roles: ['admin'] },
        { id: 'parents', labelKey: 'parents', icon: Users, roles: ['admin'] },
        { id: 'access_control', labelKey: 'access_control', icon: ScanFace, roles: ['admin', 'personnel administratif', 'surveillant'] },
        { id: 'staff', labelKey: 'admin_staff', icon: Scale, roles: ['admin', 'personnel administratif', 'enseignant'] },
        { id: 'responsibility_zones', labelKey: 'responsibility_zones', icon: ShieldCheck, roles: ['admin', 'personnel administratif', 'enseignant'] },
        { id: 'document_generator', labelKey: 'document_generator', icon: FileBadge, roles: ['admin', 'personnel administratif'] },
        { id: 'finance', labelKey: 'finance', icon: Wallet, roles: ['admin', 'comptable', 'gestionnaire_comptable', 'parent'] },
        { id: 'discipline', labelKey: 'discipline', icon: ShieldAlert, roles: ['admin', 'enseignant', 'personnel administratif'] },
        { id: 'strategic_optimizations', labelKey: 'strategic_optimizations', icon: Sparkles, roles: ['admin', 'enseignant'] },
        { id: 'recent_connections', labelKey: 'recent_connections', icon: Activity, roles: ['admin'] },
        { id: 'audit_logs', labelKey: 'audit_logs', icon: History, roles: ['admin'] },
        { id: 'scanner', labelKey: 'scanner', icon: ScanLine, roles: ['admin'] },
        { id: 'kiosk', labelKey: 'kiosk', icon: ScanFace, roles: ['admin'] },
        { id: 'mobile_app', labelKey: 'mobile_app', icon: Smartphone, roles: ['admin'] },
        { id: 'integration', labelKey: 'integration', icon: Code, roles: ['admin'] },
        { id: 'dossiers_agents', labelKey: 'dossiers_agents', icon: FileText, roles: ['admin'] },
        { id: 'tech_sheet', labelKey: 'tech_sheet', icon: Cpu, roles: ['admin'] },
        { id: 'settings', labelKey: 'settings', icon: Settings, roles: ['admin', 'enseignant', 'personnel administratif', 'parent', 'cuisinier', 'élève'] },
        { id: 'trash', labelKey: 'trash', icon: Trash2, roles: ['admin', 'enseignant', 'personnel administratif'] },
      ]
    }
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col print:hidden transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            {currentEstablishment && !isSuperAdmin ? (
              <div className="flex items-center gap-2">
                <img 
                  src={currentEstablishment.logo || "/logo.png"} 
                  alt={currentEstablishment.nom} 
                  className="h-10 w-10 object-cover rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm shrink-0" 
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 block tracking-wider uppercase leading-none mb-0.5 shrink-0">
                    {currentEstablishment.id}
                  </span>
                  <span className="text-[11px] font-extrabold text-gray-800 dark:text-gray-200 block truncate leading-none max-w-[130px] shrink-0" title={currentEstablishment.nom}>
                    {currentEstablishment.nom}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Edu-Nify" className="h-10 object-contain shrink-0" />
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 block tracking-wider uppercase leading-none mb-0.5 shrink-0">
                    Super Admin
                  </span>
                  <span className="text-[11px] font-extrabold text-gray-800 dark:text-gray-200 block truncate leading-none max-w-[130px] shrink-0">
                    Edu-Nify SaaS
                  </span>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 py-4 px-4 overflow-y-auto custom-scrollbar">
          {categories.map((category, idx) => {
            const filteredItems = category.items
              .filter(item => {
                if (item.id === 'dossiers_agents' && !isSuperAdmin) {
                  return false;
                }

                if (isSuperAdmin && item.roles.includes('admin')) {
                  return true;
                }
                
                const role = (currentUser?.role as string) || '';
                
                // Direct filtered items for Teachers (enseignant) to avoid cognitive overload
                if (role === 'enseignant') {
                  const allowedTeacherTabs = [
                    'dashboard', 'newsfeed', 'directory', 'messaging', 'profile', 
                    'digital_binder', 'classroom', 'classes', 'courses_subjects', 
                    'homework', 'grades', 'planning', 'attendance', 'surveys', 
                    'ai_assistant', 'settings', 'trash'
                  ];
                  if (!allowedTeacherTabs.includes(item.id)) return false;
                }
                
                // Direct filtered items for Parents to keep it simple and focused
                if (role === 'parent') {
                  const allowedParentTabs = [
                    'dashboard', 'newsfeed', 'messaging', 'profile', 'digital_binder', 'calendar', 'planning', 'homework', 'grades', 'houses', 'clubs', 'leaderboard', 'library', 'canteen', 'surveys', 'finance', 'settings'
                  ];
                  if (!allowedParentTabs.includes(item.id)) return false;
                }
                
                // Direct filtered items for Students (élève)
                if (role === 'élève') {
                  const allowedStudentTabs = [
                    'student_dashboard', 'newsfeed', 'directory', 'messaging', 'profile', 
                    'digital_binder', 'classroom', 'grades', 'homework', 'student_card', 
                    'canteen', 'planning', 'surveys', 'settings'
                  ];
                  if (!allowedStudentTabs.includes(item.id)) return false;
                }

                // Direct filtered items for Cooks (cuisinier)
                if (role === 'cuisinier') {
                  const allowedCookTabs = [
                    'dashboard', 'canteen', 'settings'
                  ];
                  if (!allowedCookTabs.includes(item.id)) return false;
                }
                
                if ((item.id === 'finance' || item.id === 'users' || item.id === 'dashboard') && (
                  role === 'comptable' || 
                  role === 'gestionnaire_comptable' ||
                  (role === 'personnel administratif' && currentUser?.position === 'comptable')
                )) {
                  return true;
                }
                return item.roles.includes(role);
              })
              .sort((a, b) => {
                const labelA = t(a.labelKey) || a.id;
                const labelB = t(b.labelKey) || b.id;
                return labelA.localeCompare(labelB, 'fr', { sensitivity: 'base' });
              });
            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className="mb-6 last:mb-0">
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {category.title}
                </h3>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const customPrimary = currentEstablishment?.primaryColor || '#4f46e5';
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors ${
                          isActive 
                            ? 'font-extrabold' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                        }`}
                        style={isActive ? { backgroundColor: `${customPrimary}15`, color: customPrimary } : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={20} style={isActive ? { color: customPrimary } : undefined} className={isActive ? '' : 'text-gray-400 dark:text-gray-500'} />
                          <span className="truncate">{t(item.labelKey)}</span>
                        </div>
                        {item.id === 'messaging' && totalUnreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0 space-y-3 bg-gray-50/30 dark:bg-gray-800/20">
          {currentUser && (
            <button
              onClick={() => handleTabClick('profile')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left border border-transparent hover:border-gray-150 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-750/50 group shadow-sm/5 hover:shadow-sm ${
                activeTab === 'profile' ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-950/50' : ''
              }`}
            >
              {currentUser?.photo ? (
                <img 
                  src={currentUser.photo} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0 shadow-inner group-hover:scale-105 transition-transform" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm uppercase shrink-0 group-hover:scale-105 transition-transform border border-indigo-100/50 dark:border-indigo-950/50 shadow-inner">
                  {currentUser?.prenom?.[0] || currentUser?.nom?.[0] || currentUser?.email?.[0] || 'A'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-black text-gray-950 dark:text-white truncate leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {currentUser?.prenom || currentUser?.nom 
                    ? `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() 
                    : currentUser?.email?.split('@')[0] || 'Utilisateur'}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize truncate font-bold tracking-wider mt-0.5">
                  {currentUser?.role || 'Compte'}
                </p>
              </div>
            </button>
          )}

          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all font-semibold text-xs cursor-pointer active:scale-98"
          >
            <LogOut size={18} />
            {t('logout')}
          </button>
        </div>
      </div>
    </>
  );
}

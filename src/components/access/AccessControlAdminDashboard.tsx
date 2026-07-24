import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Clock, MapPin, Calendar, TrendingUp, ShieldCheck, PieChart as PieChartIcon, BarChart3, ArrowDownRight, ArrowUpRight, Filter, Download } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AccessControlAdminDashboardProps {
  schoolId: string;
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AccessControlAdminDashboard({ schoolId }: AccessControlAdminDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [entryExitState, setEntryExitState] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;

    // Listen to accessLogs for selected date
    const qLogs = query(
      collection(db, 'accessLogs'),
      where('schoolId', '==', schoolId),
      where('date', '==', selectedDate)
    );

    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTodayLogs(logs);
      setLoading(false);
    });

    // Listen to entryExitLogs
    const qEE = query(
      collection(db, 'entryExitLogs'),
      where('schoolId', '==', schoolId),
      where('date', '==', selectedDate)
    );

    const unsubEE = onSnapshot(qEE, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEntryExitState(list);
    });

    // Fetch total registered students for KPI denominator
    const qUsers = query(collection(db, 'users'), where('role', '==', 'élève'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubLogs();
      unsubEE();
      unsubUsers();
    };
  }, [schoolId, selectedDate]);

  // Calculated Analytics
  const totalStudentsCount = students.length || 150; // fallback if empty
  const currentlyPresentCount = entryExitState.filter(e => e.lastState === 'présent').length;
  const loggedOutCount = entryExitState.filter(e => e.lastState === 'sorti').length;
  
  // Calculate Lateness (arrivals after 08:00 AM)
  const lateCount = todayLogs.filter(l => l.eventType === 'entrée' && l.heure > '08:00').length;
  const absentCount = Math.max(0, totalStudentsCount - (currentlyPresentCount + loggedOutCount));

  // Average arrival time calculation
  const arrivalLogs = todayLogs.filter(l => l.eventType === 'entrée');
  let avgArrivalStr = '--:--';
  if (arrivalLogs.length > 0) {
    const totalMinutes = arrivalLogs.reduce((acc, l) => {
      const [h, m] = (l.heure || '08:00').split(':').map(Number);
      return acc + (h * 60 + m);
    }, 0);
    const avgMin = Math.round(totalMinutes / arrivalLogs.length);
    const avgH = Math.floor(avgMin / 60);
    const avgM = avgMin % 60;
    avgArrivalStr = `${String(avgH).padStart(2, '0')}:${String(avgM).padStart(2, '0')}`;
  }

  // Hourly Flow Chart Data
  const hourlyDataMap: { [hour: string]: { hour: string; entrées: number; sorties: number } } = {};
  for (let h = 7; h <= 18; h++) {
    const hourLabel = `${String(h).padStart(2, '0')}h`;
    hourlyDataMap[hourLabel] = { hour: hourLabel, entrées: 0, sorties: 0 };
  }

  todayLogs.forEach(log => {
    if (!log.heure) return;
    const hNum = parseInt(log.heure.split(':')[0], 10);
    const hourLabel = `${String(hNum).padStart(2, '0')}h`;
    if (hourlyDataMap[hourLabel]) {
      if (log.eventType === 'entrée') hourlyDataMap[hourLabel].entrées++;
      else if (log.eventType === 'sortie') hourlyDataMap[hourLabel].sorties++;
    }
  });

  const hourlyChartData = Object.values(hourlyDataMap);

  // Access Point Sollicitation Data
  const gateMap: { [gate: string]: number } = {};
  todayLogs.forEach(l => {
    const gate = l.pointAcces || 'Portail principal';
    gateMap[gate] = (gateMap[gate] || 0) + 1;
  });

  const gateChartData = Object.entries(gateMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Date Filter & Export Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">Tableau de Bord & Analytics Accès</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Statistiques temps réel du contrôle d'accès au portail</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-xs">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-gray-900 dark:text-white font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Currently Present */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-3xl p-5 shadow-lg border border-indigo-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Actuellement Présents</span>
            <div className="p-2 bg-indigo-700/60 rounded-xl">
              <UserCheck className="w-5 h-5 text-indigo-200" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black">{currentlyPresentCount}</span>
            <span className="text-xs text-indigo-200 ml-2">/ {totalStudentsCount} élèves</span>
            <p className="text-[10px] text-indigo-300 mt-1 flex items-center gap-1">
              <ArrowUpRight size={12} className="text-emerald-400" /> Dans l'enceinte de l'établissement
            </p>
          </div>
        </div>

        {/* KPI 2: Absent */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Élèves Absents</span>
            <div className="p-2 bg-red-100 dark:bg-red-950/60 rounded-xl text-red-600 dark:text-red-400">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{absentCount}</span>
            <p className="text-[10px] text-red-500 font-bold mt-1">Aucune entrée enregistrée ce jour</p>
          </div>
        </div>

        {/* KPI 3: Retards */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Retards au Portail</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{lateCount}</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Entrées après 08:00 AM</p>
          </div>
        </div>

        {/* KPI 4: Average Arrival Time */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Heure Moyenne d'Arrivée</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{avgArrivalStr}</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Moyenne globale des scannages</p>
          </div>
        </div>
      </div>

      {/* Recharts Graphical Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Hourly Passage Flow */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Flux des Passages par Heure</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comparatif des entrées et sorties au cours de la journée</p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyChartData}>
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="entrées" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Entrées" />
                <Bar dataKey="sorties" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Sorties" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Gate Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Répartition par Point d'Accès</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sollicitation des portails de l'établissement</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {gateChartData.length === 0 ? (
              <p className="text-xs text-gray-400">Aucun passage enregistré pour cette date</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gateChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {gateChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

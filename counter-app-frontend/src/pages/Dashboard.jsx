import React, { useEffect, useState } from 'react';
import apiInvoker from '../utils/apiInvoker';
import properties from '../properties/properties';
import { Plus, RotateCcw, TrendingUp, User, LogOut } from 'lucide-react';
const CHUNK_SIZE = 108;


const Dashboard = () => {
    const [localCount, setLocalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const userId = localStorage.getItem('userId') || 'demo-user';
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    useEffect(() => {
        if (!userId) {
            window.location.href = '/';
            return;
        }

        apiInvoker.get(
            properties.api.counter,
            (data) => {
                const local = parseInt(localStorage.getItem('localCount') || '0', 10);
                const synced = data.count || 0;
                const final = local >= synced ? local : synced;

                setLocalCount(final);
                localStorage.setItem('localCount', final);
                setLoading(false);
            },
            (err) => {
                console.error("Error loading counter:", err);
                setLoading(false);
            },
            { 'x-user-id': userId }
        );
    }, [userId]);


    const handleIncrement = () => {
        const current = parseInt(localStorage.getItem('localCount') || '0', 10) + 1;

        setLocalCount(current);
        localStorage.setItem('localCount', current);

        if (current % CHUNK_SIZE === 0) {
            setSyncing(true);
            apiInvoker.post(
                properties.api.counter,
                {},
                (data) => {
                    console.log(`✅ Synced ${CHUNK_SIZE} counts`);
                    localStorage.setItem('lastSyncedCount', current); // Just track
                    setSyncing(false);
                    // ❌ Don't setLocalCount(data.count)
                },
                (err) => {
                    console.error("❌ Error syncing:", err);
                    setSyncing(false);
                },
                { 'x-user-id': userId }
            );
        }
    };


    const handleReset = () => {
        setLocalCount(0);
        localStorage.setItem('localCount', '0');

        apiInvoker.post(
            properties.api.counter + '/reset',
            {},
            () => console.log('Counter reset'),
            (err) => console.error("Error resetting counter:", err),
            { 'x-user-id': userId }
        );
    };

  
    const confirmReset = () => {
        handleReset();

        setShowResetConfirm(false);
    };

    const unsyncedCount = parseInt(localStorage.getItem('unsyncedCount') || '0', 10);

        const handleLogout = async () => {
    try {
        await apiInvoker.post(
            properties.api.logout, // make sure this is set to '/logout' in your properties file
            {},
            () => {
                console.log("✅ Logout successful");
            },
            (err) => {
                console.error("❌ Logout failed:", err);
            },
            { 'x-user-id': userId }
        );
    } catch (err) {
        console.error("Unexpected logout error:", err);
    } finally {
        localStorage.removeItem('userId');
        localStorage.removeItem('localCount');
        localStorage.removeItem('lastSyncedCount');
        window.location.href = '/';
    }
};

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }





    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-sm text-gray-500">Track your progress</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <User className="w-5 h-5" />
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Counter Card */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-xl p-8 text-center relative overflow-hidden touch-manipulation select-none"
                            onClick={handleIncrement}
                            role="button"
                             onDoubleClick={(e) => e.preventDefault()}
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleIncrement()}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                            <div className="relative z-10">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
                                    <TrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Today's Count</h2>
                                <div className="text-8xl font-black text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text mb-8">
                                    {localCount.toLocaleString()}
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Synced Sets of 108</span>
                                    <span className="font-bold text-blue-700">
                                        {Math.floor(localCount / CHUNK_SIZE)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${Math.min(((localCount % CHUNK_SIZE) / CHUNK_SIZE) * 100, 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-xl p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Current Count</span>
                                    <span className="font-bold text-gray-900">{localCount}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Unsynced</span>
                                    <span className={`font-bold ${localCount % CHUNK_SIZE > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                        {localCount % CHUNK_SIZE}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Sync Progress</span>
                                    <span className="text-sm text-gray-500">
                                        {localCount % CHUNK_SIZE}/{CHUNK_SIZE}
                                    </span>
                                </div>

                                

                                
                            </div>
                        </div>
                    </div>

                </div>

                {/* Status Bar */}
                {syncing && (
                    <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-700 font-medium">Syncing to server...</span>
                    </div>
                )}
            </main>
            {showResetConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Reset Counter?</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to reset the counter to <strong>0</strong>?</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={confirmReset}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                            >
                                Yes, Reset
                            </button>
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
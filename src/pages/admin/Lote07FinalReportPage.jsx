
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoteInjectionSummary from '@/components/admin/LoteInjectionSummary';
import Lote07VerificationChecklist from '@/components/admin/Lote07VerificationChecklist';
import { Card, CardContent } from '@/components/ui/card';

const Lote07FinalReportPage = () => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Link to="/admin/dashboard">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lote 07 Final Report</h1>
                    </div>
                    <p className="text-gray-500 pl-10">Comprehensive closure documentation for the massive injection operation.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Verified Status
                    </Button>
                </div>
            </div>

            {/* Main Summary Widget */}
            <div className="print:break-inside-avoid">
                <LoteInjectionSummary loteNumber="07" />
            </div>

            {/* Detailed Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Lote07VerificationChecklist />
                    
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-4">Closure Statement</h3>
                            <div className="prose max-w-none text-gray-600">
                                <p>
                                    This document certifies the successful completion of the automated massive injection protocol. 
                                    Starting with Lote 01 and concluding with Lote 07, the system has scaled from initial testing 
                                    to a full fleet of 67 operational hotels.
                                </p>
                                <p className="mt-2">
                                    All 231 rooms have been verified against the master schema. Inventory systems, pricing engines, 
                                    and multimedia synchronization pipelines are fully active and stable.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-slate-800">
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <h4 className="text-slate-400 text-xs uppercase font-bold tracking-wider">Final State</h4>
                                <p className="text-3xl font-bold text-green-400">OPERATIONAL</p>
                            </div>
                            <div className="border-t border-slate-700 pt-4">
                                <h4 className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total Inventory</h4>
                                <p className="text-xl font-semibold">231 Units</p>
                            </div>
                            <div className="border-t border-slate-700 pt-4">
                                <h4 className="text-slate-400 text-xs uppercase font-bold tracking-wider">Coverage</h4>
                                <p className="text-xl font-semibold">67 Destinations</p>
                            </div>
                            <div className="border-t border-slate-700 pt-4">
                                <h4 className="text-slate-400 text-xs uppercase font-bold tracking-wider">Completion Date</h4>
                                <p className="text-sm font-mono text-slate-300">2026-02-06</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Lote07FinalReportPage;

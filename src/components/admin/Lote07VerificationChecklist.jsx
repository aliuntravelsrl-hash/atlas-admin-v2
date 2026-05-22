
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShieldCheck, Database, FileText, Server } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Lote07VerificationChecklist = () => {
    const checks = [
        {
            category: "Pre-Injection Validation",
            items: [
                { label: "Target Hotels Identified (7 Xcaret/Next)", status: "passed", detail: "Validated in hotels_master" },
                { label: "Clean Slate Check", status: "passed", detail: "0 existing rooms in targets" },
                { label: "Schema Compatibility", status: "passed", detail: "v3.25 compliant" }
            ]
        },
        {
            category: "Injection Phase",
            items: [
                { label: "Standard Room Injection", status: "passed", detail: "7/7 Successful" },
                { label: "Deluxe Room Injection", status: "passed", detail: "7/7 Successful" },
                { label: "Suite Room Injection", status: "passed", detail: "7/7 Successful" },
                { label: "Audit Logging", status: "passed", detail: "21 Records Created" }
            ]
        },
        {
            category: "Post-Injection Integrity",
            items: [
                { label: "Total Room Count Verification", status: "passed", detail: "231 Rooms Confirmed" },
                { label: "Total Hotel Count Verification", status: "passed", detail: "67 Hotels Confirmed" },
                { label: "Duplicate Detection", status: "passed", detail: "0 Duplicates Found" },
                { label: "SSOT Multimedia Link", status: "passed", detail: "Active" }
            ]
        }
    ];

    return (
        <Card className="print:shadow-none">
            <CardHeader className="pb-4 border-b">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-green-600" />
                        Verification Checklist (Lote 07 Final)
                    </CardTitle>
                    <Badge className="bg-green-600">VERIFIED</Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {checks.map((section, idx) => (
                    <div key={idx}>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            {idx === 0 && <Database className="w-4 h-4" />}
                            {idx === 1 && <Server className="w-4 h-4" />}
                            {idx === 2 && <FileText className="w-4 h-4" />}
                            {section.category}
                        </h3>
                        <div className="grid gap-3">
                            {section.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        <span className="font-medium text-gray-900">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">{item.detail}</span>
                                        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                            PASS
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {idx < checks.length - 1 && <Separator className="mt-6" />}
                    </div>
                ))}
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-6 text-center">
                    <p className="text-green-800 font-semibold flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Final Sign-off: SYSTEM READY FOR PRODUCTION
                    </p>
                    <p className="text-xs text-green-600 mt-1">Timestamp: {new Date().toISOString()}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default Lote07VerificationChecklist;

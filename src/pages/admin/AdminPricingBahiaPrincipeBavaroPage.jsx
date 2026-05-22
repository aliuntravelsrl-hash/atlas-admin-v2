import React from 'react';
import { Helmet } from 'react-helmet';
import AdminPricingPanel from '@/components/admin/AdminPricingPanel';

const AdminPricingBahiaPrincipeBavaroPage = () => {
    const hotelSlug = 'bahia-principe-bavaro';
    const hotelName = 'Bahia Principe Bavaro';

    return (
        <>
            <Helmet>
                <title>Precios: {hotelName} | Panel de Administración</title>
            </Helmet>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Gestionar Precios de {hotelName}</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <AdminPricingPanel hotelSlug={hotelSlug} />
                </div>
            </div>
        </>
    );
};

export default AdminPricingBahiaPrincipeBavaroPage;
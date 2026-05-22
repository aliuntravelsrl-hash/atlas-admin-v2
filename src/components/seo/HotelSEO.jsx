import React from 'react';
import { Helmet } from 'react-helmet';

const HotelSEO = ({ hotel }) => {
  const title = `${hotel.name} - Punta Cana, República Dominicana`;
  const description = hotel.description ? hotel.description.substring(0, 160) : `Reserva tu estancia en ${hotel.name}. El mejor precio garantizado en Punta Cana.`;
  const image = hotel.image || "https://horizons-cdn.hostinger.com/9aa3598d-c7c2-4444-9692-63413f42665e/default-hotel.jpg";
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const schema = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": hotel.name,
    "description": description,
    "image": image,
    "url": url,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Punta Cana",
      "addressCountry": "DO",
      "streetAddress": hotel.location || "Punta Cana"
    },
    "telephone": "+1-829-964-8443",
    "email": "info@aliuntravelsrl.com",
    "starRating": {
      "@type": "Rating",
      "ratingValue": hotel.rating || 5
    },
    "priceRange": "$$$"
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={`${hotel.name}, hotel punta cana, resort republica dominicana, todo incluido, vacaciones caribe`} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="UTF-8" />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="es_ES" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical */}
      <link rel="canonical" href={url} />
      
      {/* Schema.org */}
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default HotelSEO;
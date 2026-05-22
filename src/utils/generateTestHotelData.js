
/**
 * Utility to generate test hotel data for seeding or verification.
 */
export const generateTestHotelData = () => {
    return {
        name: "Test Resort & Spa Punta Cana",
        slug: "test-resort-punta-cana",
        description: "A luxury experience in the heart of the Caribbean.",
        long_description: "Experience the ultimate vacation at Test Resort...",
        address: "Boulevard Turístico del Este, Punta Cana 23000",
        phone: "+1 809-555-0199",
        email: "reservations@testresort.com",
        latitude: 18.5601,
        longitude: -68.3625,
        video_id: "dQw4w9WgXcQ", // Safe placeholder
        rating: 5,
        stars: 5,
        publish: false,
        
        gallery_data: [
            { src: "https://example.com/pool.jpg", alt: "Main Pool", category: "exterior" },
            { src: "https://example.com/room.jpg", alt: "Suite Interior", category: "interior" }
        ],
        
        rooms_data: [
            {
                id: "suite_ocean",
                name: "Ocean View Suite",
                description: "Panoramic views of the ocean.",
                base_price: 350,
                max_occupancy: 4,
                features: ["King Bed", "Jacuzzi", "Balcony"]
            }
        ],
        
        services_data: [
            { title: "Spa & Wellness", description: "Full service spa.", icon: "Sparkles" },
            { title: "Water Sports", description: "Kayaking and snorkeling.", icon: "Waves" }
        ],
        
        restaurants_data: [
            { name: "La Plaza", cuisine: "International Buffet", hours: "7am - 10pm" },
            { name: "Sakura", cuisine: "Asian Fusion", hours: "6pm - 10pm" }
        ],
        
        page_structure: {
            sections: ["hero", "about", "rooms", "services", "gastronomy", "gallery", "booking", "contact"]
        },
        
        highlights: ["Private Beach", "5 Pools", "Casino"],
        amenities: ["Wifi", "Parking", "Room Service", "Gym"]
    };
};

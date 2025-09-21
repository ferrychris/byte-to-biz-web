// Function to enrich location data with AI-generated metadata
import { LocationMetadata, generateLocationMetadata } from './location-metadata.ts';

export interface LocationItem {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
  services: string[];
  businessHours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  metadata: {
    description: string;
    keywords: string[];
    localAreaKeywords: string[];
  };
  isPrimary: boolean;
}

export async function enrichLocationData(
  businessName: string,
  businessType: string,
  locations: LocationItem[],
  openAIApiKey: string
): Promise<LocationItem[]> {
  const enrichedLocations: LocationItem[] = [];
  
  // Process locations in parallel with a limit of 3 concurrent requests
  const batchSize = 3;
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    const promises = batch.map(async (location) => {
      // Skip enrichment if metadata is already complete
      if (
        location.metadata &&
        location.metadata.description &&
        location.metadata.keywords &&
        location.metadata.keywords.length > 0 &&
        location.metadata.localAreaKeywords &&
        location.metadata.localAreaKeywords.length > 0
      ) {
        return location;
      }
      
      try {
        // Generate metadata using AI
        const metadata = await generateLocationMetadata(
          businessName,
          businessType,
          location.name,
          location.city,
          location.state,
          openAIApiKey
        );
        
        // Create a new location object with the enriched metadata
        return {
          ...location,
          metadata: {
            description: metadata.description,
            keywords: metadata.keywords,
            localAreaKeywords: metadata.localAreaKeywords
          }
        };
      } catch (error) {
        console.error(`Error enriching location ${location.name}: ${error}`);
        // Return original location if enrichment fails
        return location;
      }
    });
    
    // Wait for the current batch to complete
    const batchResults = await Promise.all(promises);
    enrichedLocations.push(...batchResults);
  }
  
  return enrichedLocations;
}

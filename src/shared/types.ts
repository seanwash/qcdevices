export interface Device {
	category: string;
	name: string;
	basedOn: string;
	addedInCorOS: string;
	deviceCategory?: string; // V2/Plugin subcategory (e.g., "Guitar amps")
	previousName?: string;
	updatedInCorOS?: string;
	pluginSource?: string; // Plugin devices only (e.g., "Archetype: Plini X")
}

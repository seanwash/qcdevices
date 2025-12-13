import { describe, expect, it } from "bun:test";
import type { Device } from "@/types";

/**
 * Filter devices by keyword and category.
 * Extracted from App.tsx DeviceTableWrapper filtering logic.
 */
function filterDevices(
	devices: Device[],
	keyword: string,
	selectedCategory: string,
): Device[] {
	const lowerKeyword = keyword.toLowerCase();
	return devices.filter((device) => {
		const matchesKeyword =
			keyword === "" ||
			device.name.toLowerCase().includes(lowerKeyword) ||
			device.basedOn.toLowerCase().includes(lowerKeyword) ||
			(device.deviceCategory?.toLowerCase().includes(lowerKeyword) ?? false) ||
			(device.previousName?.toLowerCase().includes(lowerKeyword) ?? false);

		const matchesCategory =
			selectedCategory === "all" || device.category === selectedCategory;

		return matchesKeyword && matchesCategory;
	});
}

describe("filterDevices", () => {
	const mockDevices: Device[] = [
		{
			category: "Guitar amps",
			name: "Twin Reverb",
			basedOn: "Fender Twin Reverb",
			addedInCorOS: "1.0.0",
			previousName: "Old Twin",
		},
		{
			category: "Neural Captures V2",
			name: "Brit 2203",
			basedOn: "Marshall JCM800",
			addedInCorOS: "3.3.0",
			deviceCategory: "Guitar amps",
		},
		{
			category: "Delay",
			name: "Analog Delay",
			basedOn: "Boss DM-2",
			addedInCorOS: "1.0.0",
		},
		{
			category: "Reverb",
			name: "Spring Reverb",
			basedOn: "Fender Reverb Tank",
			addedInCorOS: "1.0.0",
		},
	];

	describe("keyword filtering", () => {
		it("should return all devices when keyword is empty", () => {
			const result = filterDevices(mockDevices, "", "all");
			expect(result).toHaveLength(4);
		});

		it("should filter by name (case-insensitive)", () => {
			const result = filterDevices(mockDevices, "twin", "all");
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Twin Reverb");
		});

		it("should filter by basedOn field", () => {
			const result = filterDevices(mockDevices, "marshall", "all");
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Brit 2203");
		});

		it("should filter by deviceCategory", () => {
			const result = filterDevices(mockDevices, "guitar amps", "all");
			// Only matches Brit 2203 which has deviceCategory: 'Guitar amps'
			// Twin Reverb has category: 'Guitar amps' but category isn't searched
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Brit 2203");
		});

		it("should filter by previousName", () => {
			const result = filterDevices(mockDevices, "old twin", "all");
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Twin Reverb");
		});

		it("should match partial strings", () => {
			const result = filterDevices(mockDevices, "rev", "all");
			expect(result).toHaveLength(2);
		});

		it("should handle uppercase search terms", () => {
			const result = filterDevices(mockDevices, "TWIN", "all");
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Twin Reverb");
		});
	});

	describe("category filtering", () => {
		it('should return all devices when category is "all"', () => {
			const result = filterDevices(mockDevices, "", "all");
			expect(result).toHaveLength(4);
		});

		it("should filter by exact category match", () => {
			const result = filterDevices(mockDevices, "", "Delay");
			expect(result).toHaveLength(1);
			expect(result[0].category).toBe("Delay");
		});

		it("should return empty array for non-existent category", () => {
			const result = filterDevices(mockDevices, "", "NonExistent");
			expect(result).toHaveLength(0);
		});
	});

	describe("combined filtering", () => {
		it("should apply both keyword and category filters", () => {
			const result = filterDevices(mockDevices, "reverb", "Reverb");
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Spring Reverb");
		});

		it("should return empty when keyword matches but category does not", () => {
			const result = filterDevices(mockDevices, "twin", "Delay");
			expect(result).toHaveLength(0);
		});

		it("should return empty when no matches", () => {
			const result = filterDevices(mockDevices, "xyz", "all");
			expect(result).toHaveLength(0);
		});
	});

	describe("edge cases", () => {
		it("should handle empty devices array", () => {
			const result = filterDevices([], "test", "all");
			expect(result).toHaveLength(0);
		});

		it("should handle devices with undefined optional fields", () => {
			const devicesWithOptional: Device[] = [
				{
					category: "Test",
					name: "Device",
					basedOn: "Based",
					addedInCorOS: "1.0.0",
				},
			];

			const result = filterDevices(devicesWithOptional, "something", "all");
			expect(result).toHaveLength(0);
		});

		it("should not crash when searching for special regex characters", () => {
			// biome-ignore lint/suspicious/noTemplateCurlyInString: testing regex special chars
			const result = filterDevices(mockDevices, ".*+?^${}()|[]\\", "all");
			expect(result).toHaveLength(0);
		});
	});
});

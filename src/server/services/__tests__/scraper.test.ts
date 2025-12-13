import { describe, expect, it, spyOn } from "bun:test";
import { extractDevices, scrapeDevices } from "../scraper";

describe("scraper", () => {
	describe("extractDevices", () => {
		describe("5-column standard schema", () => {
			it("should parse Guitar amps with all fields", () => {
				const html = `
          <html><body>
            <h2>Guitar amps</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Twin Reverb</div>
                <div class="sc-ec576641-0">Fender Twin Reverb 65</div>
                <div class="sc-ec576641-0">1.0.0</div>
                <div class="sc-ec576641-0">Old Twin</div>
                <div class="sc-ec576641-0">2.0.0</div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices).toHaveLength(1);
				expect(devices[0]).toEqual({
					category: "Guitar amps",
					name: "Twin Reverb",
					basedOn: "Fender Twin Reverb 65",
					addedInCorOS: "1.0.0",
					previousName: "Old Twin",
					updatedInCorOS: "2.0.0",
				});
			});

			it("should handle empty optional fields", () => {
				const html = `
          <html><body>
            <h2>Delay</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Analog Delay</div>
                <div class="sc-ec576641-0">Boss DM-2</div>
                <div class="sc-ec576641-0">1.0.0</div>
                <div class="sc-ec576641-0"></div>
                <div class="sc-ec576641-0"></div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices).toHaveLength(1);
				expect(devices[0].previousName).toBeUndefined();
				expect(devices[0].updatedInCorOS).toBeUndefined();
			});
		});

		describe("4-column Neural Captures V2 schema", () => {
			it("should parse with deviceCategory", () => {
				const html = `
          <html><body>
            <h2>Neural Captures V2</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Guitar amps</div>
                <div class="sc-ec576641-0">Brit 2203 87</div>
                <div class="sc-ec576641-0">Marshall JCM800</div>
                <div class="sc-ec576641-0">3.3.0</div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices).toHaveLength(1);
				expect(devices[0]).toEqual({
					category: "Neural Captures V2",
					name: "Brit 2203 87",
					basedOn: "Marshall JCM800",
					addedInCorOS: "3.3.0",
					deviceCategory: "Guitar amps",
				});
			});
		});

		describe("4-column Plugin devices schema", () => {
			it("should parse with pluginSource", () => {
				const html = `
          <html><body>
            <h2>Plugin devices</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Guitar amps</div>
                <div class="sc-ec576641-0">Archetype Plini Clean</div>
                <div class="sc-ec576641-0">2.0.0</div>
                <div class="sc-ec576641-0">Archetype: Plini X</div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices).toHaveLength(1);
				expect(devices[0]).toEqual({
					category: "Plugin devices",
					name: "Archetype Plini Clean",
					basedOn: "",
					addedInCorOS: "2.0.0",
					deviceCategory: "Guitar amps",
					pluginSource: "Archetype: Plini X",
				});
			});
		});

		describe("2-column schema", () => {
			it("should parse IR loader", () => {
				const html = `
          <html><body>
            <h2>IR loader</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">IR Loader 1x1</div>
                <div class="sc-ec576641-0">1.0.0</div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices).toHaveLength(1);
				expect(devices[0]).toEqual({
					category: "IR loader",
					name: "IR Loader 1x1",
					basedOn: "",
					addedInCorOS: "1.0.0",
				});
			});

			it("should parse Looper", () => {
				const html = `
          <html><body>
            <h2>Looper</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Looper</div>
                <div class="sc-ec576641-0">1.0.0</div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices).toHaveLength(1);
				expect(devices[0].category).toBe("Looper");
			});

			it("should parse Utility", () => {
				const html = `
          <html><body>
            <h2>Utility</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Splitter</div>
                <div class="sc-ec576641-0">1.0.0</div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices).toHaveLength(1);
				expect(devices[0].category).toBe("Utility");
			});
		});

		describe("version regex filtering", () => {
			it("should filter version numbers from basedOn field", () => {
				const html = `
          <html><body>
            <h2>Guitar amps</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Test Amp</div>
                <div class="sc-ec576641-0">1.0.0</div>
                <div class="sc-ec576641-0">2.0.0</div>
                <div class="sc-ec576641-0"></div>
                <div class="sc-ec576641-0"></div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices[0].basedOn).toBe("");
				expect(devices[0].addedInCorOS).toBe("2.0.0");
			});

			it("should accept valid basedOn text that is not a version", () => {
				const html = `
          <html><body>
            <h2>Guitar amps</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Test Amp</div>
                <div class="sc-ec576641-0">Fender Deluxe Reverb 65</div>
                <div class="sc-ec576641-0">1.0.0</div>
                <div class="sc-ec576641-0"></div>
                <div class="sc-ec576641-0"></div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices[0].basedOn).toBe("Fender Deluxe Reverb 65");
			});

			it("should match version formats X.X and X.X.X", () => {
				const VERSION_REGEX = /^\d+\.\d+(\.\d+)?$/;

				expect(VERSION_REGEX.test("1.0")).toBe(true);
				expect(VERSION_REGEX.test("1.0.0")).toBe(true);
				expect(VERSION_REGEX.test("10.20.30")).toBe(true);
				expect(VERSION_REGEX.test("3.3.0")).toBe(true);
				expect(VERSION_REGEX.test("v1.0.0")).toBe(false);
				expect(VERSION_REGEX.test("1.0.0.0")).toBe(false);
				expect(VERSION_REGEX.test("Marshall JCM800")).toBe(false);
				expect(VERSION_REGEX.test("Fender 65")).toBe(false);
			});
		});

		describe("category handling", () => {
			it('should skip "Announced devices that have not yet been released" category', () => {
				const html = `
          <html><body>
            <h2>Announced devices that have not yet been released</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Future Device</div>
                <div class="sc-ec576641-0">1.0.0</div>
              </div>
            </div>
            <h2>IR loader</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Real Device</div>
                <div class="sc-ec576641-0">1.0.0</div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices).toHaveLength(1);
				expect(devices[0].name).toBe("Real Device");
			});

			it("should skip unknown categories not in CATEGORY_SCHEMAS", () => {
				const html = `
          <html><body>
            <h2>Unknown Category XYZ</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Some Device</div>
                <div class="sc-ec576641-0">1.0.0</div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices).toHaveLength(0);
			});

			it("should handle multiple categories in one HTML document", () => {
				const html = `
          <html><body>
            <h2>Delay</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Analog Delay</div>
                <div class="sc-ec576641-0">Boss DM-2</div>
                <div class="sc-ec576641-0">1.0.0</div>
                <div class="sc-ec576641-0"></div>
                <div class="sc-ec576641-0"></div>
              </div>
            </div>
            <h2>Reverb</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">Spring Reverb</div>
                <div class="sc-ec576641-0">Fender Reverb Tank</div>
                <div class="sc-ec576641-0">1.0.0</div>
                <div class="sc-ec576641-0"></div>
                <div class="sc-ec576641-0"></div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices).toHaveLength(2);
				expect(devices[0].category).toBe("Delay");
				expect(devices[1].category).toBe("Reverb");
			});
		});

		describe("edge cases", () => {
			it("should handle empty HTML", () => {
				const devices = extractDevices("");
				expect(devices).toEqual([]);
			});

			it("should handle HTML with no h2 headings", () => {
				const html = "<html><body><p>No categories here</p></body></html>";
				const devices = extractDevices(html);
				expect(devices).toEqual([]);
			});

			it("should skip rows without a name", () => {
				const html = `
          <html><body>
            <h2>IR loader</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0"></div>
                <div class="sc-ec576641-0">1.0.0</div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);
				expect(devices).toHaveLength(0);
			});

			it("should skip rows with insufficient columns", () => {
				const html = `
          <html><body>
            <h2>Guitar amps</h2>
            <div>
              <div class="sc-97391185-0">
                <!-- Only one column when schema expects 5 -->
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);
				expect(devices).toHaveLength(0);
			});

			it("should trim whitespace from all extracted values", () => {
				const html = `
          <html><body>
            <h2>IR loader</h2>
            <div>
              <div class="sc-97391185-0">
                <div class="sc-ec576641-0">  IR Loader 1x1  </div>
                <div class="sc-ec576641-0">  1.0.0  </div>
              </div>
            </div>
          </body></html>
        `;

				const devices = extractDevices(html);

				expect(devices[0].name).toBe("IR Loader 1x1");
				expect(devices[0].addedInCorOS).toBe("1.0.0");
			});

			it("should handle category with no container div", () => {
				const html = `
          <html><body>
            <h2>IR loader</h2>
            <p>No table here</p>
          </body></html>
        `;

				const devices = extractDevices(html);
				expect(devices).toHaveLength(0);
			});
		});
	});

	describe("scrapeDevices", () => {
		it("should fetch and parse HTML from URL", async () => {
			const mockHtml = `
        <html><body>
          <h2>IR loader</h2>
          <div>
            <div class="sc-97391185-0">
              <div class="sc-ec576641-0">IR Loader</div>
              <div class="sc-ec576641-0">1.0.0</div>
            </div>
          </div>
        </body></html>
      `;

			spyOn(globalThis, "fetch").mockResolvedValueOnce(
				new Response(mockHtml, { status: 200 }),
			);

			const devices = await scrapeDevices("https://example.com/devices");

			expect(devices).toHaveLength(1);
		});

		it("should throw error on HTTP error response", async () => {
			spyOn(globalThis, "fetch").mockResolvedValueOnce(
				new Response(null, { status: 404 }),
			);

			expect(scrapeDevices()).rejects.toThrow("Failed to fetch page: HTTP 404");
		});

		it("should throw error on empty response", async () => {
			spyOn(globalThis, "fetch").mockResolvedValueOnce(
				new Response("", { status: 200 }),
			);

			expect(scrapeDevices()).rejects.toThrow(
				"Received empty response from page",
			);
		});

		it("should handle network errors", async () => {
			spyOn(globalThis, "fetch").mockRejectedValueOnce(
				new Error("Network error"),
			);

			expect(scrapeDevices()).rejects.toThrow("Network error");
		});
	});
});

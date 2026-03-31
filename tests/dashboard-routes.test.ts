import {
  buildPipelinePath,
  getGmailOauthToast,
  getPipelineAppIdFromSearch,
  getSettingsSectionFromSearch,
} from "@/lib/navigation/dashboard-routes";

describe("dashboard route helpers", () => {
  it("derives selected application id from pipeline query", () => {
    expect(getPipelineAppIdFromSearch(new URLSearchParams("app=abc123"))).toBe("abc123");
    expect(getPipelineAppIdFromSearch(new URLSearchParams("app=%20"))).toBeNull();
    expect(getPipelineAppIdFromSearch(new URLSearchParams(""))).toBeNull();
  });

  it("builds pipeline URL while preserving unrelated params", () => {
    const params = new URLSearchParams("status=saved&sort=updated_at");
    expect(buildPipelinePath(params, "app-1")).toBe("/dashboard/pipeline?status=saved&sort=updated_at&app=app-1");
    expect(buildPipelinePath(new URLSearchParams("status=saved&app=old"), null)).toBe("/dashboard/pipeline?status=saved");
  });

  it("parses settings section and OAuth toast state", () => {
    expect(getSettingsSectionFromSearch(new URLSearchParams("section=profile"))).toBe("profile");
    expect(getSettingsSectionFromSearch(new URLSearchParams("section=integrations"))).toBe("integrations");
    expect(getSettingsSectionFromSearch(new URLSearchParams("section=other"))).toBeNull();

    expect(getGmailOauthToast(new URLSearchParams("connected=1"))).toEqual({
      type: "success",
      message: "Gmail connected.",
    });
    expect(getGmailOauthToast(new URLSearchParams("error=oauth_state_invalid"))).toEqual({
      type: "error",
      message: "Gmail: oauth state invalid",
    });
    expect(getGmailOauthToast(new URLSearchParams(""))).toBeNull();
  });
});

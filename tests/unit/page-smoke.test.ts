import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { SettingsClient } from "@/app/settings/settings-client";
import { RoundtableClient } from "@/app/roundtable/roundtable-client";
import { CourtroomClient } from "@/components/court/courtroom-client";

describe("page smoke", () => {
  it("renders home page shell", async () => {
    const html = renderToStaticMarkup(await Home());
    expect(html).toContain("圆桌");
    expect(html).toContain("入席");
  });

  it("renders settings page shell", () => {
    const html = renderToStaticMarkup(createElement(SettingsClient));
    expect(html).toContain("砚台");
    expect(html).toContain("执笔授权码");
  });

  it("renders roundtable page shell", () => {
    const html = renderToStaticMarkup(createElement(RoundtableClient, { skills: [], initialTopic: "题目" }));
    expect(html).toContain("今日所议");
    expect(html).toContain("讨论席名录尚未备好");
  });

  it("renders courtroom page shell", () => {
    const html = renderToStaticMarkup(createElement(CourtroomClient, { skills: [], initialTopic: "案由" }));
    expect(html).toContain("开庭设置");
    expect(html).toContain("讨论席名录尚未备好");
  });
});

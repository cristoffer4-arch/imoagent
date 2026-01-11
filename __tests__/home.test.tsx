import { render, screen } from "@testing-library/react";
import Home from "../src/app/page";

describe("Home page", () => {
  it("renders hero copy", () => {
    render(<Home />);
    expect(
      screen.getByText(/Imoagent: plataforma imobiliária completa/i),
    ).toBeInTheDocument();
  });

  it("lists seven IA modules", () => {
    render(<Home />);
    const badges = screen.getAllByText(/IA /i);
    expect(badges.length).toBeGreaterThanOrEqual(7);
  });
});

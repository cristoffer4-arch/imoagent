export async function handler(): Promise<Response> {
  const body = {
    function: "ia-gamificacao",
    status: "ok",
    mechanics: ["ranking", "feed", "competicoes", "mini-games", "badges"],
    mini_games: ["puzzle", "tabuleiro", "arcade", "quiz"],
  };

  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}

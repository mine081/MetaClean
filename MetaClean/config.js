// Configuração do MetaClean.
// As contas usam o Netlify Identity (sistema de login do próprio Netlify):
// não há chaves nem senhas para colar aqui. Este arquivo só define o comportamento do site.
window.MC_CONFIG = {
  // Página inicial: criar conta. Quem já está logado vai direto para o limpador.
  PAGINA_CADASTRO: '/',
  PAGINA_LOGIN: '/login.html',
  // Página protegida: só abre para quem tem conta e está logado.
  PAGINA_LIMPADOR: '/limpador.html',
  PAGINA_REDEFINIR_SENHA: '/redefinir-senha.html',
  // Tamanho mínimo da senha no cadastro e na redefinição.
  SENHA_MINIMA: 8,
};

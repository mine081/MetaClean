/* MetaClean — cabeçalho, rodapé e contas (Netlify Identity) */
import {
  signup, login, logout, getUser, handleAuthCallback,
  requestPasswordRecovery, updateUser, acceptInvite,
} from '/vendor/netlify-identity.mjs';

const $ = (s, r = document) => r.querySelector(s);
const cfg = Object.assign({
  PAGINA_CADASTRO: '/',
  PAGINA_LOGIN: '/login.html',
  PAGINA_LIMPADOR: '/limpador.html',
  PAGINA_REDEFINIR_SENHA: '/redefinir-senha.html',
  SENHA_MINIMA: 8,
}, window.MC_CONFIG || {});
const MIN = cfg.SENHA_MINIMA;
const INVITE_KEY = 'mc_invite_token';

/* Traduz os erros do Netlify Identity */
function friendly(err) {
  const msg = (err && err.message) || '';
  const st = err && err.status;
  if (/already been registered|already exists/i.test(msg)) return 'Este e-mail já tem uma conta. Entre ou use "Esqueci minha senha".';
  if (/not confirmed/i.test(msg)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/password invalid|invalid password|no user found|invalid_grant/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/password.*(short|least|characters)/i.test(msg)) return `A senha precisa ter pelo menos ${MIN} caracteres.`;
  if (/signups? not allowed|disabled/i.test(msg)) return 'O cadastro de novas contas está fechado no momento.';
  if (/expired|invalid.*token|token.*invalid|not found/i.test(msg)) return 'Este link expirou ou já foi usado. Peça um novo.';
  if (st === 429 || /rate limit|too many/i.test(msg)) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  if (/failed to fetch|network|timed? ?out/i.test(msg)) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
  if (/email.*invalid|invalid.*email|unable to validate email/i.test(msg)) return 'Digite um e-mail válido.';
  return 'Algo deu errado. Tente de novo.';
}
const validEmail = e => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const clean = v => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const fail = err => { throw new Error(friendly(err)); };

/* Ações usadas pelos formulários */
async function api(route, body = {}) {
  const email = clean(body.email);

  if (route === 'register') {
    if (!validEmail(email)) throw new Error('Digite um e-mail válido.');
    if ((body.password || '').length < MIN) throw new Error(`A senha precisa ter pelo menos ${MIN} caracteres.`);
    const user = await signup(email, body.password).catch(fail);
    // Com confirmação por e-mail ligada, a conta só fica ativa depois do clique no link.
    return user && user.confirmedAt ? { ok: true } : { ok: true, pending: true };
  }

  if (route === 'login') {
    if (!validEmail(email) || !body.password) throw new Error('E-mail ou senha incorretos.');
    await login(email, body.password).catch(fail);
    return { ok: true };
  }

  if (route === 'logout') {
    try { await logout(); } catch {}
    return { ok: true };
  }

  if (route === 'forgot') {
    if (!validEmail(email)) throw new Error('Digite um e-mail válido.');
    try { await requestPasswordRecovery(email); }
    catch (err) {
      // Mesma resposta exista a conta ou não; só repassa erros de rede/limite.
      if (err && (err.status === 429 || /failed to fetch|network/i.test(err.message || ''))) fail(err);
    }
    return { ok: true };
  }

  if (route === 'reset') {
    if ((body.password || '').length < MIN) throw new Error(`A senha precisa ter pelo menos ${MIN} caracteres.`);
    const invite = sessionStorage.getItem(INVITE_KEY);
    if (invite) {
      await acceptInvite(invite, body.password).catch(fail);
      sessionStorage.removeItem(INVITE_KEY);
      return { ok: true };
    }
    if (!(await getUser())) throw new Error('Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".');
    await updateUser({ password: body.password }).catch(fail);
    return { ok: true };
  }

  throw new Error('Ação desconhecida.');
}

function mount(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; return el; }

function renderHeader(user) {
  const nav = user
    ? `<span class="who"></span><button type="button" id="mc-logout">Sair</button>`
    : `<a class="sec" href="${cfg.PAGINA_LOGIN}">Entrar</a><a class="pri" href="${cfg.PAGINA_CADASTRO}">Criar conta</a>`;
  const home = user ? cfg.PAGINA_LIMPADOR : cfg.PAGINA_CADASTRO;
  const el = mount('mc-header', `<header class="mc-header"><div class="in"><a class="mc-brand" href="${home}">🧼 Meta<span>Clean</span></a><nav class="mc-nav">${nav}</nav></div></header>`);
  if (user && el) {
    const who = $('.who', el); who.textContent = user.email || ''; who.title = user.email || '';
    $('#mc-logout', el).onclick = async () => { await api('logout'); location.href = cfg.PAGINA_CADASTRO; };
  }
}

function renderFooter() {
  mount('mc-footer', `<footer class="mc-footer">Copyright © 2026 MetaClean. Todos os direitos reservados.</footer>`);
}

/* Liga um formulário a uma ação */
function bindForm(form, route, { extra, onOk } = {}) {
  const msg = $('.msg', form.parentElement) || $('.msg', form);
  const btn = $('button[type=submit]', form);
  const show = (text, kind) => { msg.textContent = text; msg.className = 'msg show ' + kind; };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.className = 'msg';
    const body = Object.fromEntries(new FormData(form));
    if (extra) { const bad = extra(body); if (bad) return show(bad, 'err'); }
    btn.disabled = true;
    try { const data = await api(route, body); await onOk(data, show); }
    catch (err) { show(err.message, 'err'); btn.disabled = false; }
  });
}

/* Mostra um aviso no topo da página (ex.: link de e-mail expirado) */
function notice(text) {
  const box = document.createElement('div');
  box.className = 'mc-notice';
  box.textContent = text;
  document.body.prepend(box);
}

/*
 * Ao abrir qualquer página:
 * 1) processa links vindos por e-mail (confirmação de conta, redefinição de senha, convite);
 * 2) aplica a regra de acesso da página (data-auth no <html>):
 *    - "required": só quem está logado (o limpador). Sem conta → vai para a página de cadastro.
 *    - "guest": páginas de criar conta / entrar. Quem já está logado → vai para o limpador.
 */
async function init() {
  const here = location.pathname.replace(/\/index\.html$/, '/');
  const access = document.documentElement.dataset.auth || '';

  try {
    const cb = await handleAuthCallback();
    if (cb && cb.type === 'invite' && cb.token) {
      sessionStorage.setItem(INVITE_KEY, cb.token);
      if (here !== cfg.PAGINA_REDEFINIR_SENHA) { location.replace(cfg.PAGINA_REDEFINIR_SENHA); return null; }
    } else if (cb && cb.type === 'recovery') {
      if (here !== cfg.PAGINA_REDEFINIR_SENHA) { location.replace(cfg.PAGINA_REDEFINIR_SENHA); return cb.user; }
    } else if (cb && cb.user) {
      location.replace(cfg.PAGINA_LIMPADOR); return cb.user;
    }
  } catch (err) {
    history.replaceState(null, '', location.pathname + location.search);
    notice('Este link expirou ou já foi usado. ' + (/confirm/i.test(err && err.message || '') ? 'Tente entrar ou crie a conta de novo.' : 'Peça um novo.'));
  }

  let user = null;
  try { user = await getUser(); } catch {}

  if (access === 'required' && !user) { location.replace(cfg.PAGINA_CADASTRO); return null; }
  if (access === 'guest' && user) { location.replace(cfg.PAGINA_LIMPADOR); return user; }

  renderHeader(user);
  document.documentElement.classList.add('mc-ready');
  return user;
}

renderFooter();
const ready = init();
window.MC = { api, bindForm, ready, config: cfg, hasInvite: () => !!sessionStorage.getItem(INVITE_KEY) };

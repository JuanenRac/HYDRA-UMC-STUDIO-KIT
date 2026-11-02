// =============================================================================
// HYDRA-UMC-STUDIO-KIT - src/messages.ts
// Copyright (C) 2026 JuanenRac (Electro Hobby 3D) <electrohobby3d@gmail.com>
// GPL-3.0-or-later - see LICENSE
// =============================================================================
// The few texts the kit hands to a person (an error of the server, the buttons of a tour, the name of a sign-in event), in the eight languages of the
// ecosystem: en, es, de, fr, it, ja, zh and pt (European Portuguese). A client with its own catalog can ignore this file; one without can use it as it is.

export const LANGUAGES = ['en', 'es', 'de', 'fr', 'it', 'ja', 'zh', 'pt'] as const;
export type Language = (typeof LANGUAGES)[number];

type Row = Record<Language, string>;

const row = (en: string, es: string, de: string, fr: string, it: string, ja: string, zh: string, pt: string): Row => ({ en, es, de, fr, it, ja, zh, pt });

export const MESSAGES = {
  'http.network': row('The server cannot be reached.', 'No se puede alcanzar el servidor.', 'Der Server ist nicht erreichbar.', 'Le serveur est injoignable.',
    'Il server non è raggiungibile.', 'サーバーに接続できません。', '无法连接到服务器。', 'Não é possível contactar o servidor.'),
  'http.timeout': row('The server did not answer in time.', 'El servidor no respondió a tiempo.', 'Der Server hat nicht rechtzeitig geantwortet.',
    "Le serveur n'a pas répondu à temps.", 'Il server non ha risposto in tempo.', 'サーバーが時間内に応答しませんでした。', '服务器未在规定时间内响应。', 'O servidor não respondeu a tempo.'),
  'http.aborted': row('The request was cancelled.', 'La petición se canceló.', 'Die Anfrage wurde abgebrochen.', 'La requête a été annulée.',
    'La richiesta è stata annullata.', 'リクエストはキャンセルされました。', '请求已取消。', 'O pedido foi cancelado.'),
  'http.unauthorized': row('Sign in again: the session is not valid.', 'Vuelve a iniciar sesión: la sesión no es válida.', 'Bitte erneut anmelden: Die Sitzung ist ungültig.',
    "Reconnectez-vous : la session n'est pas valide.", 'Accedi di nuovo: la sessione non è valida.', 'もう一度サインインしてください。セッションが無効です。',
    '请重新登录：会话无效。', 'Inicie sessão novamente: a sessão não é válida.'),
  'http.forbidden': row('This account is not allowed to do that.', 'Esta cuenta no tiene permiso para hacerlo.', 'Dieses Konto darf das nicht.',
    "Ce compte n'est pas autorisé à le faire.", 'Questo account non è autorizzato a farlo.', 'このアカウントには、その操作の権限がありません。',
    '此账户无权执行该操作。', 'Esta conta não tem permissão para o fazer.'),
  'http.not_found': row('The server does not have that route (it may be older).', 'El servidor no tiene esa ruta (puede ser más antiguo).',
    'Der Server kennt diese Route nicht (möglicherweise ist er älter).', "Le serveur n'a pas cette route (il est peut-être plus ancien).",
    'Il server non ha questa route (potrebbe essere più vecchio).', 'サーバーにそのルートがありません（古いバージョンの可能性があります）。',
    '服务器没有该路由（可能版本较旧）。', 'O servidor não tem essa rota (pode ser mais antigo).'),
  'http.server': row('The server failed (HTTP {status}).', 'El servidor falló (HTTP {status}).', 'Der Server ist fehlgeschlagen (HTTP {status}).',
    'Le serveur a échoué (HTTP {status}).', 'Il server ha avuto un errore (HTTP {status}).', 'サーバーでエラーが発生しました（HTTP {status}）。',
    '服务器出错（HTTP {status}）。', 'O servidor falhou (HTTP {status}).'),
  'http.status': row('The server answered HTTP {status}.', 'El servidor respondió HTTP {status}.', 'Der Server antwortete mit HTTP {status}.',
    'Le serveur a répondu HTTP {status}.', 'Il server ha risposto HTTP {status}.', 'サーバーが HTTP {status} を返しました。', '服务器返回 HTTP {status}。',
    'O servidor respondeu HTTP {status}.'),
  'http.parse': row('The answer of the server could not be read.', 'No se pudo leer la respuesta del servidor.', 'Die Antwort des Servers konnte nicht gelesen werden.',
    "La réponse du serveur n'a pas pu être lue.", 'Non è stato possibile leggere la risposta del server.', 'サーバーの応答を読み取れませんでした。',
    '无法读取服务器的响应。', 'Não foi possível ler a resposta do servidor.'),

  'tour.next': row('Next', 'Siguiente', 'Weiter', 'Suivant', 'Avanti', '次へ', '下一步', 'Seguinte'),
  'tour.back': row('Back', 'Atrás', 'Zurück', 'Retour', 'Indietro', '戻る', '上一步', 'Anterior'),
  'tour.skip': row('Skip tour', 'Saltar el recorrido', 'Rundgang überspringen', 'Passer la visite', 'Salta il tour', 'ツアーをスキップ', '跳过导览', 'Saltar a visita'),
  'tour.done': row('Done', 'Hecho', 'Fertig', 'Terminé', 'Fine', '完了', '完成', 'Concluir'),
  'tour.step': row('Step {current} of {total}', 'Paso {current} de {total}', 'Schritt {current} von {total}', 'Étape {current} sur {total}',
    'Passo {current} di {total}', 'ステップ {current} / {total}', '第 {current} 步，共 {total} 步', 'Passo {current} de {total}'),

  'history.first_seen': row('First seen', 'Visto por primera vez', 'Erstmals gesehen', 'Vu pour la première fois', 'Visto per la prima volta', '初回確認', '首次出现', 'Visto pela primeira vez'),
  'history.login': row('Signed in', 'Sesión iniciada', 'Angemeldet', 'Connecté', 'Accesso eseguito', 'サインイン', '已登录', 'Sessão iniciada'),
  'history.login_failed': row('Sign-in refused', 'Inicio de sesión rechazado', 'Anmeldung abgelehnt', 'Connexion refusée', 'Accesso rifiutato', 'サインイン拒否', '登录被拒绝', 'Início de sessão recusado'),
  'history.second_factor_failed': row('Wrong second-step code', 'Código del segundo paso incorrecto', 'Falscher Code für den zweiten Schritt', 'Code de la seconde étape incorrect',
    'Codice del secondo passaggio errato', '2 段階目のコードが違います', '第二步验证码错误', 'Código do segundo passo incorreto'),
  'history.logout': row('Signed out', 'Sesión cerrada', 'Abgemeldet', 'Déconnecté', 'Disconnesso', 'サインアウト', '已退出', 'Sessão terminada'),
  'history.session_ended': row('Session ended', 'Sesión terminada', 'Sitzung beendet', 'Session terminée', 'Sessione terminata', 'セッション終了', '会话已结束', 'Sessão terminada'),
  'history.session_expired': row('Session expired', 'Sesión caducada', 'Sitzung abgelaufen', 'Session expirée', 'Sessione scaduta', 'セッション期限切れ', '会话已过期', 'Sessão expirada'),
} as const satisfies Record<string, Row>;

export type MessageKey = keyof typeof MESSAGES;

/** The language of a BCP 47 tag (`pt-PT`, `zh-CN`, `de_AT`...) when the kit has it, otherwise `fallback` (English by default). */
export function pickLanguage(tag: string | null | undefined, fallback: Language = 'en'): Language {
  const base = (tag ?? '').toLowerCase().split(/[-_]/)[0] ?? '';
  return (LANGUAGES as readonly string[]).includes(base) ? (base as Language) : fallback;
}

/** The text of `key` in `language`, with every `{name}` replaced by the parameter of that name. */
export function kitText(language: Language, key: MessageKey, params: Record<string, string | number> = {}): string {
  const template: string = MESSAGES[key][language];
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

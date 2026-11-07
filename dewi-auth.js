// DEWI - sessie-auth voor de studio-pagina's (07-11).
// Sinds migratie revoke_anon_select_on_internal_views (06-11) mag de anon-key de
// interne views niet meer lezen; alleen een ingelogde gebruiker (rol authenticated).
// Dit script zet op elk verzoek naar Supabase REST/RPC het access_token van de
// bestaande login-sessie (dezelfde als kpi/organisation, localStorage
// sb-jucubuoftjehwancegma-auth-token). supabase-js ververst het token zelf.
// Geen sessie -> door naar de login (organisation.html).
// Vereist vooraf: supabase-js@2 (UMD) en dewi-config.js.
(function(){
  var C = window.DEWI_CONFIG || {};
  var URL = C.SUPABASE_URL || "https://jucubuoftjehwancegma.supabase.co";
  var KEY = C.SUPABASE_ANON_KEY;
  if(!window.supabase || !KEY){ console.error("[dewi-auth] supabase-js of dewi-config.js ontbreekt"); return; }
  var sb = window.DEWI_SB || window.supabase.createClient(URL, KEY);
  window.DEWI_SB = sb;
  var origFetch = window.fetch.bind(window);
  var redirecting = false;
  function toLogin(){
    if(redirecting) return; redirecting = true;
    location.replace("organisation.html");
  }
  window.fetch = function(input, init){
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if(url.indexOf(URL + "/rest/v1/") !== 0) return origFetch(input, init);
    return sb.auth.getSession().then(function(r){
      var s = r && r.data && r.data.session;
      if(!s){ toLogin(); return new Promise(function(){}); }
      var opts = Object.assign({}, init || {});
      var h = new Headers(opts.headers || (typeof input !== "string" && input.headers) || {});
      h.set("apikey", KEY);
      h.set("Authorization", "Bearer " + s.access_token);
      opts.headers = h;
      return origFetch(input, opts).then(function(res){
        if(res.status === 401) console.warn("[dewi-auth] 401 met sessie — log opnieuw in via organisation.html");
        return res;
      });
    });
  };
})();

/* eslint-disable no-nested-ternary */
/* SmtpJS.com - v3.0.0 */
const Email = {
  send (a) {
    return new Promise((n, e) => {
      a.nocache = Math.floor(1e6 * Math.random() + 1);
      a.Action = "Send";
      const t = JSON.stringify(a);
      Email.ajaxPost("https://smtpjs.com/v3/smtpjs.aspx?", t, (e) => {
        n(e);
      });
    });
  },
  ajaxPost (e, n, t) {
    const a = Email.createCORSRequest("POST", e);
    a.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    a.onload = function () {
      const e = a.responseText;
      t != null && t(e);
    };
    a.send(n);
  },
  ajax (e, n) {
    const t = Email.createCORSRequest("GET", e);
    t.onload = function () {
      const e = t.responseText;
      n != null && n(e);
    };
    t.send();
  },
  createCORSRequest (e, n) {
    let t = new XMLHttpRequest();

    "withCredentials" in t
      ? t.open(e, n, !0)
      : typeof global.XDomainRequest !== "undefined"
        ? t = new global.XDomainRequest().open(e, n)
        : t = null;

    return t;
  },
};

export default Email;

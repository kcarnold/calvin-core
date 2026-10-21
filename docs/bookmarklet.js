// The catalog-page bookmarklet was retired in favor of the Core Planner.
// Existing bookmarks still load this file, so it points them to the app.
(() => {
  const id = 'ca-bookmarklet-moved';
  document.getElementById(id)?.remove();
  const banner = document.createElement('div');
  banner.id = id;
  banner.setAttribute('role', 'alert');
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:12px 16px;'
    + 'background:#1d5c63;color:#fff;font:15px/1.4 Arial,Helvetica,sans-serif;text-align:center;';
  banner.append('The Calvin Core Annotator bookmarklet has been replaced by the ');
  const link = document.createElement('a');
  link.href = 'https://kcarnold.github.io/calvin-core/';
  link.textContent = 'Core Planner';
  link.style.cssText = 'color:#fff;font-weight:bold;text-decoration:underline;';
  banner.append(link, '. You can delete this bookmark. ');
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Dismiss';
  close.style.cssText = 'margin-left:8px;padding:2px 10px;border:1px solid #fff;border-radius:4px;'
    + 'background:transparent;color:#fff;font:inherit;cursor:pointer;';
  close.addEventListener('click', () => banner.remove());
  banner.append(close);
  (document.body || document.documentElement).append(banner);
})();

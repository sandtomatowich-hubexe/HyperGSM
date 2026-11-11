# shared helpers
GMS=com.google.android.gms
detect_region(){
  r=$(getprop ro.miui.build.region); [ -z "$r" ] && r=$(getprop ro.miui.region)
  echo "$r" | tr 'A-Z' 'a-z'
}
detect_mode(){
  case "$MODE" in cn|global) echo "$MODE"; return;; esac
  [ "$(detect_region)" = "cn" ] && echo cn || echo global
}
valid_pkg(){ case "$1" in ""|*[!A-Za-z0-9_.]*) return 1;; *.*) return 0;; *) return 1;; esac; }
installed(){ pm path "$1" >/dev/null 2>&1; }

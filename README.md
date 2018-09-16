# VIEApps NGX Books

## General

This is *"skeleton"* app for development with Ionic 4 on latest Angular/Web Components, focus on some keys:

- Single code-base for all platforms: web (browsers), mobile (iOS, Android), desktop (macOS, Windows, Linux)
- Configable dynamic form/view controls with multi-languages
- Real-time update data via WebSocket

## Detail

This is front-end of **books** service from ***apis.vieapps.net***, that provides *"free"* e-book resources that are appeared on the Internet like VnThuQuan.net, iSach.info, .... (Vietnamese books only) with some very simple features:

- Online reading with three modes: day, night and middle (of the day)
- Sync bookmarks and continue reading on other devices
- e-book files (.EPUB and .MOBI) are downloadable to your device like iPhone, Kindle, ... for offline reading
- ....

So please take a look at:
- Real-world app => https://viebooks.net
- Back-end microservice (source) => [Services.Books](https://github.com/vieapps/Services.Books)

## ng2-completer workaround

The dynamic forms service uses *ng2-completer* for lookup controls, but ng2-completer is still use rxjs v5 and will cause some errors.

To workaround with these issues, just open and modify all lines that ng2-completer uses to import rsjx

- "rxjs/Observable", "rxjs/Subject", "rxjs/observable/timer" => "rxjs" (ex: import { Observable as Observable$1 } from 'rxjs/Observable' => import { Observable as Observable$1 } from 'rxjs')
- "rxjs/add/operator/catch" => "rxjs/operator"

Listing of files that need to modify:

- ~/node_modules/ng2-completer/esm5/ng2-comleter.js
- ~/node_modules/ng2-completer/esm2015/ng2-comleter.js
- ~/node_modules/ng2-completer/src/services/completer-base-data.d.ts
- ~/node_modules/ng2-completer/src/services/completer-data.d.ts
- ~/node_modules/ng2-completer/src/services/completer-service.d.ts
- ~/node_modules/ng2-completer/src/services/local-data.d.ts

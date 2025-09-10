"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5Cwork%5Cgit_project%5Clogistics-driver-management%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cwork%5Cgit_project%5Clogistics-driver-management&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5Cwork%5Cgit_project%5Clogistics-driver-management%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cwork%5Cgit_project%5Clogistics-driver-management&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_work_git_project_logistics_driver_management_src_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/[...nextauth]/route.ts */ \"(rsc)/./src/app/api/auth/[...nextauth]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"C:\\\\work\\\\git_project\\\\logistics-driver-management\\\\src\\\\app\\\\api\\\\auth\\\\[...nextauth]\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_work_git_project_logistics_driver_management_src_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/[...nextauth]/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDd29yayU1Q2dpdF9wcm9qZWN0JTVDbG9naXN0aWNzLWRyaXZlci1tYW5hZ2VtZW50JTVDc3JjJTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDd29yayU1Q2dpdF9wcm9qZWN0JTVDbG9naXN0aWNzLWRyaXZlci1tYW5hZ2VtZW50JmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBc0c7QUFDdkM7QUFDYztBQUNnRDtBQUM3SDtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL2xvZ2lzdGljcy1kcml2ZXItbWFuYWdlbWVudC8/NzE4ZiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFx3b3JrXFxcXGdpdF9wcm9qZWN0XFxcXGxvZ2lzdGljcy1kcml2ZXItbWFuYWdlbWVudFxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiQzpcXFxcd29ya1xcXFxnaXRfcHJvamVjdFxcXFxsb2dpc3RpY3MtZHJpdmVyLW1hbmFnZW1lbnRcXFxcc3JjXFxcXGFwcFxcXFxhcGlcXFxcYXV0aFxcXFxbLi4ubmV4dGF1dGhdXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5Cwork%5Cgit_project%5Clogistics-driver-management%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cwork%5Cgit_project%5Clogistics-driver-management&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/auth/[...nextauth]/route.ts":
/*!*************************************************!*\
  !*** ./src/app/api/auth/[...nextauth]/route.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _lib_auth_config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/auth/config */ \"(rsc)/./src/lib/auth/config.ts\");\n\n\nconst handler = next_auth__WEBPACK_IMPORTED_MODULE_0___default()(_lib_auth_config__WEBPACK_IMPORTED_MODULE_1__.authOptions);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBZ0M7QUFDZTtBQUUvQyxNQUFNRSxVQUFVRixnREFBUUEsQ0FBQ0MseURBQVdBO0FBRU0iLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9sb2dpc3RpY3MtZHJpdmVyLW1hbmFnZW1lbnQvLi9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUudHM/MDA5OCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTmV4dEF1dGggZnJvbSAnbmV4dC1hdXRoJ1xuaW1wb3J0IHsgYXV0aE9wdGlvbnMgfSBmcm9tICdAL2xpYi9hdXRoL2NvbmZpZydcblxuY29uc3QgaGFuZGxlciA9IE5leHRBdXRoKGF1dGhPcHRpb25zKVxuXG5leHBvcnQgeyBoYW5kbGVyIGFzIEdFVCwgaGFuZGxlciBhcyBQT1NUIH0iXSwibmFtZXMiOlsiTmV4dEF1dGgiLCJhdXRoT3B0aW9ucyIsImhhbmRsZXIiLCJHRVQiLCJQT1NUIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/auth/[...nextauth]/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth/config.ts":
/*!********************************!*\
  !*** ./src/lib/auth/config.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(bcryptjs__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\n\nconst authOptions = {\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) {\n                    throw new Error(\"이메일과 비밀번호를 입력해주세요.\");\n                }\n                // 사용자 조회\n                const user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.user.findUnique({\n                    where: {\n                        email: credentials.email\n                    },\n                    select: {\n                        id: true,\n                        email: true,\n                        name: true,\n                        password: true,\n                        role: true,\n                        isActive: true\n                    }\n                });\n                if (!user) {\n                    throw new Error(\"등록되지 않은 이메일입니다.\");\n                }\n                if (!user.isActive) {\n                    throw new Error(\"비활성화된 계정입니다. 관리자에게 문의하세요.\");\n                }\n                if (!user.password) {\n                    throw new Error(\"비밀번호가 설정되지 않은 계정입니다.\");\n                }\n                // 비밀번호 확인\n                const isPasswordValid = await (0,bcryptjs__WEBPACK_IMPORTED_MODULE_1__.compare)(credentials.password, user.password);\n                if (!isPasswordValid) {\n                    throw new Error(\"비밀번호가 올바르지 않습니다.\");\n                }\n                // 로그인 시간 업데이트\n                await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.user.update({\n                    where: {\n                        id: user.id\n                    },\n                    data: {\n                        lastLogin: new Date()\n                    }\n                });\n                return {\n                    id: user.id,\n                    email: user.email,\n                    name: user.name,\n                    role: user.role,\n                    isActive: user.isActive\n                };\n            }\n        })\n    ],\n    session: {\n        strategy: \"jwt\",\n        maxAge: 24 * 60 * 60\n    },\n    jwt: {\n        maxAge: 24 * 60 * 60\n    },\n    callbacks: {\n        async jwt ({ token, user }) {\n            // 로그인 시점에 사용자 정보를 JWT에 저장\n            if (user) {\n                token.id = user.id;\n                token.role = user.role;\n                token.isActive = user.isActive;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            // JWT에서 세션으로 사용자 정보 전달\n            if (token) {\n                session.user.id = token.id;\n                session.user.role = token.role;\n                session.user.isActive = token.isActive;\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/auth/signin\",\n        error: \"/auth/error\"\n    },\n    events: {\n        async signIn ({ user }) {\n            // 감사 로그: 로그인 기록\n            await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.auditLog.create({\n                data: {\n                    userId: user.id,\n                    userName: user.name,\n                    action: \"LOGIN\",\n                    entityType: \"User\",\n                    entityId: user.id,\n                    changes: {\n                        loginTime: new Date().toISOString(),\n                        userAgent: \"Unknown\" // 클라이언트에서 추가 정보 필요\n                    }\n                }\n            }).catch(console.error) // 로그인 실패를 방지하기 위해 에러 무시\n            ;\n        },\n        async signOut ({ token }) {\n            // 감사 로그: 로그아웃 기록\n            if (token?.id) {\n                await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.auditLog.create({\n                    data: {\n                        userId: token.id,\n                        userName: token.name,\n                        action: \"LOGOUT\",\n                        entityType: \"User\",\n                        entityId: token.id,\n                        changes: {\n                            logoutTime: new Date().toISOString()\n                        }\n                    }\n                }).catch(console.error);\n            }\n        }\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFnQjtZQUNoQixNQUFNWCwrQ0FBTUEsQ0FBQ2lDLFFBQVEsQ0FBQ0MsTUFBTSxDQUFDO2dCQUMzQmQsTUFBTTtvQkFDSmUsUUFBUXhCLEtBQUtJLEVBQUU7b0JBQ2ZxQixVQUFVekIsS0FBS1IsSUFBSTtvQkFDbkJrQyxRQUFRO29CQUNSQyxZQUFZO29CQUNaQyxVQUFVNUIsS0FBS0ksRUFBRTtvQkFDakJ5QixTQUFTO3dCQUNQQyxXQUFXLElBQUluQixPQUFPb0IsV0FBVzt3QkFDakNDLFdBQVcsVUFBVSxtQkFBbUI7b0JBQzFDO2dCQUNGO1lBQ0YsR0FBR0MsS0FBSyxDQUFDQyxRQUFRZCxLQUFLLEVBQUUsd0JBQXdCOztRQUNsRDtRQUVBLE1BQU1lLFNBQVEsRUFBRWxCLEtBQUssRUFBRTtZQUNyQixpQkFBaUI7WUFDakIsSUFBSUEsT0FBT2IsSUFBSTtnQkFDYixNQUFNZiwrQ0FBTUEsQ0FBQ2lDLFFBQVEsQ0FBQ0MsTUFBTSxDQUFDO29CQUMzQmQsTUFBTTt3QkFDSmUsUUFBUVAsTUFBTWIsRUFBRTt3QkFDaEJxQixVQUFVUixNQUFNekIsSUFBSTt3QkFDcEJrQyxRQUFRO3dCQUNSQyxZQUFZO3dCQUNaQyxVQUFVWCxNQUFNYixFQUFFO3dCQUNsQnlCLFNBQVM7NEJBQ1BPLFlBQVksSUFBSXpCLE9BQU9vQixXQUFXO3dCQUNwQztvQkFDRjtnQkFDRixHQUFHRSxLQUFLLENBQUNDLFFBQVFkLEtBQUs7WUFDeEI7UUFDRjtJQUNGO0FBQ0YsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2xvZ2lzdGljcy1kcml2ZXItbWFuYWdlbWVudC8uL3NyYy9saWIvYXV0aC9jb25maWcudHM/N2UzMSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0QXV0aE9wdGlvbnMgfSBmcm9tICduZXh0LWF1dGgnXG5pbXBvcnQgQ3JlZGVudGlhbHNQcm92aWRlciBmcm9tICduZXh0LWF1dGgvcHJvdmlkZXJzL2NyZWRlbnRpYWxzJ1xuaW1wb3J0IHsgY29tcGFyZSB9IGZyb20gJ2JjcnlwdGpzJ1xuaW1wb3J0IHsgcHJpc21hIH0gZnJvbSAnQC9saWIvcHJpc21hJ1xuaW1wb3J0IHsgVXNlclJvbGUgfSBmcm9tICdAcHJpc21hL2NsaWVudCdcblxuZGVjbGFyZSBtb2R1bGUgJ25leHQtYXV0aCcge1xuICBpbnRlcmZhY2UgU2Vzc2lvbiB7XG4gICAgdXNlcjoge1xuICAgICAgaWQ6IHN0cmluZ1xuICAgICAgZW1haWw6IHN0cmluZ1xuICAgICAgbmFtZTogc3RyaW5nXG4gICAgICByb2xlOiBVc2VyUm9sZVxuICAgICAgaXNBY3RpdmU6IGJvb2xlYW5cbiAgICB9XG4gIH1cbiAgXG4gIGludGVyZmFjZSBVc2VyIHtcbiAgICBpZDogc3RyaW5nXG4gICAgZW1haWw6IHN0cmluZ1xuICAgIG5hbWU6IHN0cmluZ1xuICAgIHJvbGU6IFVzZXJSb2xlXG4gICAgaXNBY3RpdmU6IGJvb2xlYW5cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnbmV4dC1hdXRoL2p3dCcge1xuICBpbnRlcmZhY2UgSldUIHtcbiAgICBpZDogc3RyaW5nXG4gICAgcm9sZTogVXNlclJvbGVcbiAgICBpc0FjdGl2ZTogYm9vbGVhblxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBhdXRoT3B0aW9uczogTmV4dEF1dGhPcHRpb25zID0ge1xuICBwcm92aWRlcnM6IFtcbiAgICBDcmVkZW50aWFsc1Byb3ZpZGVyKHtcbiAgICAgIG5hbWU6ICdjcmVkZW50aWFscycsXG4gICAgICBjcmVkZW50aWFsczoge1xuICAgICAgICBlbWFpbDogeyBsYWJlbDogJ0VtYWlsJywgdHlwZTogJ2VtYWlsJyB9LFxuICAgICAgICBwYXNzd29yZDogeyBsYWJlbDogJ1Bhc3N3b3JkJywgdHlwZTogJ3Bhc3N3b3JkJyB9XG4gICAgICB9LFxuICAgICAgYXN5bmMgYXV0aG9yaXplKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgIGlmICghY3JlZGVudGlhbHM/LmVtYWlsIHx8ICFjcmVkZW50aWFscz8ucGFzc3dvcmQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ydtOuplOydvOqzvCDruYTrsIDrsojtmLjrpbwg7J6F66Cl7ZW07KO87IS47JqULicpXG4gICAgICAgIH1cblxuICAgICAgICAvLyDsgqzsmqnsnpAg7KGw7ZqMXG4gICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgICAgICB3aGVyZTogeyBlbWFpbDogY3JlZGVudGlhbHMuZW1haWwgfSxcbiAgICAgICAgICBzZWxlY3Q6IHtcbiAgICAgICAgICAgIGlkOiB0cnVlLFxuICAgICAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgICAgICBuYW1lOiB0cnVlLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IHRydWUsXG4gICAgICAgICAgICByb2xlOiB0cnVlLFxuICAgICAgICAgICAgaXNBY3RpdmU6IHRydWUsXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcign65Ox66Gd65CY7KeAIOyViuydgCDsnbTrqZTsnbzsnoXri4jri6QuJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXNlci5pc0FjdGl2ZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcign67mE7Zmc7ISx7ZmU65CcIOqzhOygleyeheuLiOuLpC4g6rSA66as7J6Q7JeQ6rKMIOusuOydmO2VmOyEuOyalC4nKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1c2VyLnBhc3N3b3JkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfruYTrsIDrsojtmLjqsIAg7ISk7KCV65CY7KeAIOyViuydgCDqs4TsoJXsnoXri4jri6QuJylcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOu5hOuwgOuyiO2YuCDtmZXsnbhcbiAgICAgICAgY29uc3QgaXNQYXNzd29yZFZhbGlkID0gYXdhaXQgY29tcGFyZShjcmVkZW50aWFscy5wYXNzd29yZCwgdXNlci5wYXNzd29yZClcbiAgICAgICAgXG4gICAgICAgIGlmICghaXNQYXNzd29yZFZhbGlkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfruYTrsIDrsojtmLjqsIAg7Jis67CU66W07KeAIOyViuyKteuLiOuLpC4nKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g66Gc6re47J24IOyLnOqwhCDsl4XrjbDsnbTtirhcbiAgICAgICAgYXdhaXQgcHJpc21hLnVzZXIudXBkYXRlKHtcbiAgICAgICAgICB3aGVyZTogeyBpZDogdXNlci5pZCB9LFxuICAgICAgICAgIGRhdGE6IHsgbGFzdExvZ2luOiBuZXcgRGF0ZSgpIH1cbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGlkOiB1c2VyLmlkLFxuICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgICAgIG5hbWU6IHVzZXIubmFtZSxcbiAgICAgICAgICByb2xlOiB1c2VyLnJvbGUsXG4gICAgICAgICAgaXNBY3RpdmU6IHVzZXIuaXNBY3RpdmUsXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICBdLFxuICBcbiAgc2Vzc2lvbjoge1xuICAgIHN0cmF0ZWd5OiAnand0JyxcbiAgICBtYXhBZ2U6IDI0ICogNjAgKiA2MCwgLy8gMjTsi5zqsIRcbiAgfSxcbiAgXG4gIGp3dDoge1xuICAgIG1heEFnZTogMjQgKiA2MCAqIDYwLCAvLyAyNOyLnOqwhFxuICB9LFxuICBcbiAgY2FsbGJhY2tzOiB7XG4gICAgYXN5bmMgand0KHsgdG9rZW4sIHVzZXIgfSkge1xuICAgICAgLy8g66Gc6re47J24IOyLnOygkOyXkCDsgqzsmqnsnpAg7KCV67O066W8IEpXVOyXkCDsoIDsnqVcbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIHRva2VuLmlkID0gdXNlci5pZFxuICAgICAgICB0b2tlbi5yb2xlID0gdXNlci5yb2xlXG4gICAgICAgIHRva2VuLmlzQWN0aXZlID0gdXNlci5pc0FjdGl2ZVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRva2VuXG4gICAgfSxcbiAgICBcbiAgICBhc3luYyBzZXNzaW9uKHsgc2Vzc2lvbiwgdG9rZW4gfSkge1xuICAgICAgLy8gSldU7JeQ7IScIOyEuOyFmOycvOuhnCDsgqzsmqnsnpAg7KCV67O0IOyghOuLrFxuICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgIHNlc3Npb24udXNlci5pZCA9IHRva2VuLmlkXG4gICAgICAgIHNlc3Npb24udXNlci5yb2xlID0gdG9rZW4ucm9sZVxuICAgICAgICBzZXNzaW9uLnVzZXIuaXNBY3RpdmUgPSB0b2tlbi5pc0FjdGl2ZVxuICAgICAgfVxuICAgICAgcmV0dXJuIHNlc3Npb25cbiAgICB9LFxuICB9LFxuICBcbiAgcGFnZXM6IHtcbiAgICBzaWduSW46ICcvYXV0aC9zaWduaW4nLFxuICAgIGVycm9yOiAnL2F1dGgvZXJyb3InLFxuICB9LFxuICBcbiAgZXZlbnRzOiB7XG4gICAgYXN5bmMgc2lnbkluKHsgdXNlciB9KSB7XG4gICAgICAvLyDqsJDsgqwg66Gc6re4OiDroZzqt7jsnbgg6riw66GdXG4gICAgICBhd2FpdCBwcmlzbWEuYXVkaXRMb2cuY3JlYXRlKHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHVzZXJJZDogdXNlci5pZCxcbiAgICAgICAgICB1c2VyTmFtZTogdXNlci5uYW1lLFxuICAgICAgICAgIGFjdGlvbjogJ0xPR0lOJyxcbiAgICAgICAgICBlbnRpdHlUeXBlOiAnVXNlcicsXG4gICAgICAgICAgZW50aXR5SWQ6IHVzZXIuaWQsXG4gICAgICAgICAgY2hhbmdlczoge1xuICAgICAgICAgICAgbG9naW5UaW1lOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICB1c2VyQWdlbnQ6ICdVbmtub3duJyAvLyDtgbTrnbzsnbTslrjtirjsl5DshJwg7LaU6rCAIOygleuztCDtlYTsmpRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pLmNhdGNoKGNvbnNvbGUuZXJyb3IpIC8vIOuhnOq3uOyduCDsi6TtjKjrpbwg67Cp7KeA7ZWY6riwIOychO2VtCDsl5Drn6wg66y07IucXG4gICAgfSxcbiAgICBcbiAgICBhc3luYyBzaWduT3V0KHsgdG9rZW4gfSkge1xuICAgICAgLy8g6rCQ7IKsIOuhnOq3uDog66Gc6re47JWE7JuDIOq4sOuhnVxuICAgICAgaWYgKHRva2VuPy5pZCkge1xuICAgICAgICBhd2FpdCBwcmlzbWEuYXVkaXRMb2cuY3JlYXRlKHtcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICB1c2VySWQ6IHRva2VuLmlkIGFzIHN0cmluZyxcbiAgICAgICAgICAgIHVzZXJOYW1lOiB0b2tlbi5uYW1lIGFzIHN0cmluZyxcbiAgICAgICAgICAgIGFjdGlvbjogJ0xPR09VVCcsXG4gICAgICAgICAgICBlbnRpdHlUeXBlOiAnVXNlcicsXG4gICAgICAgICAgICBlbnRpdHlJZDogdG9rZW4uaWQgYXMgc3RyaW5nLFxuICAgICAgICAgICAgY2hhbmdlczoge1xuICAgICAgICAgICAgICBsb2dvdXRUaW1lOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG59Il0sIm5hbWVzIjpbIkNyZWRlbnRpYWxzUHJvdmlkZXIiLCJjb21wYXJlIiwicHJpc21hIiwiYXV0aE9wdGlvbnMiLCJwcm92aWRlcnMiLCJuYW1lIiwiY3JlZGVudGlhbHMiLCJlbWFpbCIsImxhYmVsIiwidHlwZSIsInBhc3N3b3JkIiwiYXV0aG9yaXplIiwiRXJyb3IiLCJ1c2VyIiwiZmluZFVuaXF1ZSIsIndoZXJlIiwic2VsZWN0IiwiaWQiLCJyb2xlIiwiaXNBY3RpdmUiLCJpc1Bhc3N3b3JkVmFsaWQiLCJ1cGRhdGUiLCJkYXRhIiwibGFzdExvZ2luIiwiRGF0ZSIsInNlc3Npb24iLCJzdHJhdGVneSIsIm1heEFnZSIsImp3dCIsImNhbGxiYWNrcyIsInRva2VuIiwicGFnZXMiLCJzaWduSW4iLCJlcnJvciIsImV2ZW50cyIsImF1ZGl0TG9nIiwiY3JlYXRlIiwidXNlcklkIiwidXNlck5hbWUiLCJhY3Rpb24iLCJlbnRpdHlUeXBlIiwiZW50aXR5SWQiLCJjaGFuZ2VzIiwibG9naW5UaW1lIiwidG9JU09TdHJpbmciLCJ1c2VyQWdlbnQiLCJjYXRjaCIsImNvbnNvbGUiLCJzaWduT3V0IiwibG9nb3V0VGltZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth/config.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\n// Prisma Client 싱글톤 패턴\n// 개발 환경에서 Hot Reload로 인한 다중 인스턴스 생성 방지\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log:  true ? [\n        \"query\",\n        \"error\",\n        \"warn\"\n    ] : 0\n});\nif (true) {\n    globalForPrisma.prisma = prisma;\n}\n// Prisma Client Extensions (향후 확장 가능)\n// 예: Audit Log 자동화, Soft Delete 등\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (prisma);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQTZDO0FBRTdDLHVCQUF1QjtBQUN2Qix1Q0FBdUM7QUFFdkMsTUFBTUMsa0JBQWtCQztBQUlqQixNQUFNQyxTQUFTRixnQkFBZ0JFLE1BQU0sSUFDMUMsSUFBSUgsd0RBQVlBLENBQUM7SUFDZkksS0FBS0MsS0FBeUIsR0FBZ0I7UUFBQztRQUFTO1FBQVM7S0FBTyxHQUFHLENBQVM7QUFDdEYsR0FBRTtBQUVKLElBQUlBLElBQXlCLEVBQWM7SUFDekNKLGdCQUFnQkUsTUFBTSxHQUFHQTtBQUMzQjtBQUVBLHNDQUFzQztBQUN0QyxrQ0FBa0M7QUFFbEMsaUVBQWVBLE1BQU1BLEVBQUEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9sb2dpc3RpY3MtZHJpdmVyLW1hbmFnZW1lbnQvLi9zcmMvbGliL3ByaXNtYS50cz8wMWQ3Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gJ0BwcmlzbWEvY2xpZW50J1xuXG4vLyBQcmlzbWEgQ2xpZW50IOyLseq4gO2GpCDtjKjthLRcbi8vIOqwnOuwnCDtmZjqsr3sl5DshJwgSG90IFJlbG9hZOuhnCDsnbjtlZwg64uk7KSRIOyduOyKpO2EtOyKpCDsg53shLEg67Cp7KeAXG5cbmNvbnN0IGdsb2JhbEZvclByaXNtYSA9IGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyB7XG4gIHByaXNtYTogUHJpc21hQ2xpZW50IHwgdW5kZWZpbmVkXG59XG5cbmV4cG9ydCBjb25zdCBwcmlzbWEgPSBnbG9iYWxGb3JQcmlzbWEucHJpc21hID8/IFxuICBuZXcgUHJpc21hQ2xpZW50KHtcbiAgICBsb2c6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnID8gWydxdWVyeScsICdlcnJvcicsICd3YXJuJ10gOiBbJ2Vycm9yJ10sXG4gIH0pXG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPSBwcmlzbWFcbn1cblxuLy8gUHJpc21hIENsaWVudCBFeHRlbnNpb25zICjtlqXtm4Qg7ZmV7J6lIOqwgOuKpSlcbi8vIOyYiDogQXVkaXQgTG9nIOyekOuPme2ZlCwgU29mdCBEZWxldGUg65OxXG5cbmV4cG9ydCBkZWZhdWx0IHByaXNtYSJdLCJuYW1lcyI6WyJQcmlzbWFDbGllbnQiLCJnbG9iYWxGb3JQcmlzbWEiLCJnbG9iYWxUaGlzIiwicHJpc21hIiwibG9nIiwicHJvY2VzcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/uuid","vendor-chunks/oauth","vendor-chunks/@panva","vendor-chunks/preact-render-to-string","vendor-chunks/bcryptjs","vendor-chunks/preact","vendor-chunks/oidc-token-hash","vendor-chunks/object-hash","vendor-chunks/cookie"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5Cwork%5Cgit_project%5Clogistics-driver-management%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cwork%5Cgit_project%5Clogistics-driver-management&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();
# Cadmus Shell

- [Cadmus Shell](#cadmus-shell)
  - [History](#history)
    - [4.0.9](#409)
    - [4.0.8](#408)
    - [4.0.7](#407)
    - [4.0.6](#406)
    - [4.0.5](#405)
    - [4.0.4](#404)
    - [4.0.3](#403)
    - [4.0.2](#402)
    - [4.0.1](#401)
    - [4.0.0](#400)
    - [3.1.5](#315)
    - [3.1.4](#314)
    - [3.1.3](#313)
    - [3.1.2](#312)
    - [3.1.1](#311)
    - [3.1.0](#310)
    - [3.0.0](#300)
    - [2.0.3](#203)
    - [2.0.1](#201)
    - [2.0.0](#200)

This is the second iteration of Cadmus frontend refactoring.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.0.4, and upgraded since then up to version 14. For version 15, which implies dropping a number of obsolete libraries, the repository has been cloned into this one. Once tested, development will continue on this repository, while others are kept for backwards compatibility only. Historical versions are listed here:

1. [original shell app](https://github.com/vedph/cadmus_shell): this was a draft.
2. [version 1](https://github.com/vedph/cadmus-shell): this is a production version. It was upgraded up to Angular 14.
3. version 2 is this version. It is still the same repository, with a few core changes:

- [Akita](https://github.com/salesforce/akita) has been replaced by [ELF](https://ngneat.github.io/elf/). This implies changing the store model behind each editor and list. New documentation will follow on this. This change was required by Akita obsolescence. Further, ELF has the advantage of being more modern and framework independent.
- the dirty change mechanism has been refactored and now uses [this solution](https://github.com/vedph/ngx-dirty-check).
- Angular Material has been upgraded to 15, which implies a number of style adjustments.
- `@angular/flex-layout`, which has been obsoleted, has been removed and replaced by pure CSS with some media queries where required.

💡 For pre-Angular-15 projects, see the [migration instructions](migration.md).

Quick Docker image build:

1. `npm run build-lib`.
2. update version in `env.js` and then `ng build`.
3. `docker build . -t vedph2020/cadmus-shell:4.0.9 -t vedph2020/cadmus-shell:latest` (replace with the current version).

## History

### 4.0.9

- 2023-01-24: added lookup to historical event editor. To test this, just add an `eid` metadatum to an item's metadata part, and then in another item events part refer to its value via lookup.
- 2023-01-22: changed historical events part related events thesaurus so that it uses `:` as separator.
- 2023-01-20: updated Angular and packages.
- 2023-01-17:
  - fix null in comment editor `getValue`.
  - added `TextLayerService.getTextFragment` to be used by orthography layer when comparing the original with the standard form.
  - added `frText` display to all the layer fragment editors requiring it (orthography, apparatus, quotations, witnesses).
- 2023-01-16: updated Angular and packages.
- 2023-01-05: added more methods to `ColorService` in `@myrmidon/cadmus-ui` (getting them from `cadmus-show-app`).

### 4.0.8

- 2022-12-22:
  - fix to thesaurus editor validation (`@myrmidon/cadmus-thesaurus-ui`).
  - upgraded Monaco editor changing the glob in `angular.json` to:

```json
{
  "glob": "**/*",
  "input": "node_modules/monaco-editor",
  "output": "assets/monaco-editor"
}
```

- 2022-12-19:
  - added lookup pipe to event relations list in historical event editor (`@myrmidon/cadmus-part-general-ui`).
  - updated packages.
- 2022-12-15:
  - added `flatLookup` pipe to event type in part editor (`@myrmidon/cadmus-part-general-ui`).
  - updated Angular.
  - aesthetics for philology parts, thesaurus list and UI (`@myrmidon/cadmus-part-philology-ui`, `@myrmidon/cadmus-thesaurus-list`, `@myrmidon/cadmus-thesaurus-ui`).

### 4.0.7

- 2022-12-22: fixed missing label in thesaurus add node button (`@myrmidon/cadmus-thesaurus-ui`).
- 2022-12-15: fixes:
  - wrong available parts list after saving a new item with a facet not equal to the default one (`@myrmidon/cadmus-item-editor`).
  - refresh in items list did not reload page 1 (`@myrmidon/cadmus-item-list`).
- 2022-12-14: fixed label position for note in `@myrmidon/cadmus-part-general-ui`.

### 4.0.6

- 2022-12-14:
  - updated Angular.
  - minor compilation fixes in item editor and item list.

### 4.0.5

- 2022-12-03:
  - fixed flags not displayed correctly in item editor.
  - fixed item list not in synch after item saved from editor.
  - export repositories from item list and thesaurus list.
  - changed input of flags and facets badge so that both definitions and value are input at the same time.

### 4.0.4

- 2022-12-02:
  - added repository reset to layer editors when initing them.
  - added thesaurus to orthography tags.

### 4.0.3

- 2022-12-02: fixed identity update on saving new part not reflected in editor's data (`@myrmidon/cadmus-state`, `@myrmidon-cadmus-ui`).

### 4.0.2

- 2022-12-01: updated packages.

### 4.0.1

- 2022-11-30:
  - fixes to `@myrmidon/cadmus-ui` and `@myrmidon/cadmus-state` for newly created parts.
  - allow `null` in `updateForm` part/fragment editors to make TS compiler happy.

### 4.0.0

- 2022-11-30:
  - **breaking change**: renamed thesaurus `categories` as `comment-categories` for comment part/fragment. This allows using different categories for comments and categories parts. Should you need to use the same categories, just create a thesaurus alias.
  - removed `@angular/flex-layout` from `@myrmidon/cadmus-graph-ui`, `@myrmidon/cadmus-item-editor`, `@myrmidon/cadmus-item-list`, `@myrmidon/cadmus-item-search`, `@myrmidon/cadmus-thesaurus-list`, `@myrmidon/cadmus-thesaurus-ui`, tiled text layer part and token text layer part.
  - removed `@angular/flex-layout` package from app.
- 2022-11-25: added `PinLinksPart`.
- 2022-11-24:
  - minor fixes to `@myrmidon/cadmus-item-list` and `@myrmidon/cadmus-ui`.
  - `@myrmidon/cadmus-item-editor`: wider buttons space.
  - removed `CadmusValidators` (they are now under `@myrmidon/ng-tools` as `NgToolsValidators`)
- 2022-11-08:
  - updated Angular.
  - changed prefix building in historical event editor.
  - added lookup pipe to selected event type in historical event editor.

The following history refers to version 1.

### 3.1.5

- 2022-11-03:
  - updated Angular and packages.
  - fixes to events editor.
  - hierarchical thesauri for events and relations in events editor. When specified, selecting an event type triggers filtering of relations according to the selected ID prefix. This is equal to the ID of the selected entry up to the last dot, i.e. from event type `person.crm:E67_birth` we filter all the relation entries starting with `person.`. This allows different granularity levels in filtering: for instance, should we have `person.birth.crm:E67_birth` (prefix `person.birth.`), we could have two relation entries `person.birth.P96_by_mother` and `person.birth.P97_from_father`, which are available only when a person's birth event is selected (rather than just a person's event). If no thesauri are specified, you can just fill the IDs without constraints.

### 3.1.4

- 2022-10-25:
  - in `@myrmidon/cadmus-core` fix to `textLayerService.selHasAnySpan`: check for SPAN element did not stop when adding a new selection and another selection in the context of the same ancestor is found after the insertion point.
  - updated `rangy` to 1.3.1.
  - updated Angular.

### 3.1.3

- 2022-10-10:
  - preview samples fixes.
  - updated Angular.

### 3.1.2

- 2022-10-04:
  - changed two endpoint addresses in preview API service. This affected `@myrmidon/cadmus-api` and `@myrmidon/cadmus-preview-ui`.
  - updated Angular.
  - added styles for apparatus preview.
- 2022-09-14: updated Angular.

### 3.1.1

- 2022-08-21: added matching mode to flags in items filter, API service, and core models. Now items can be filtered by flags not only by looking at all the flags set, but also to any flag set, all flags clear, and any flags clear. Affected libraries:
  - cadmus-core
  - cadmus-api
  - cadmus-state
  - cadmus-item-list
  - cadmus-item-editor
- 2022-08-08:
  - added preview service to `cadmus-api` and increased its version number.
  - added preview keys to app state in `cadmus-state` and increased its version number.
  - added preview button in item editor when preview is available (`cadmus-item-editor`).
  - replaced deprecated `substr` with `substring` in the above libraries and in `cadmus-core`, `cadmus-part-general-ui`, `cadmus-profile-core`, `cadmus-thesaurus-ui`, `cadmus-ui`, `cadmus-ui-pg`, `cadmus-graph-pg` increasing their version numbers.
  - added `cadmus-preview-ui` and `cadmus-preview-pg`.
- 2022-08-07: updated Angular.
- 2022-08-05: thesauri names for proper names/chronotopes.

### 3.1.0

- 2022-08-04: replaced `ExternalId` with `AssertedId` in comments and removed dependency from `@myrmidon/cadmus-refs-external-ids` (in `cadmus-part-general-ui` and `cadmus-part-general-pg`).
- 2022-08-02: fixes to `HistoricalEventEditor` and `NamesPartComponent`. Minor fix to `ThesaurusTreeComponent` template (removed redundant `?`).
- 2022-07-30: raised length limits for apparatus fragment notes.
- 2022-07-19: historical event editor fixes.
- 2022-07-14: updated Angular.
- 2022-07-10: updated Angular.

### 3.0.0

- 2022-06-11: upgraded to Angular 14; refactored all the forms (except those related to lookups) to typed.
- 2022-05-31: updated API version in Docker scripts.

- 2022-05-21:
  - upgraded Angular.
  - fixed historical events chronotope visualization in events list (`cadmus-part-general-ui`).

### 2.0.3

- 2022-04-29:
  - upgraded Angular to 13.3.5.
  - fixed item editor flags on logout/login.
  - fixed item search layout.
- 2022-03-19: removed moment and fixes to metadata part editor. Libraries affected: cadmus-item-editor, cadmus-item-list, cadmus-item-search, cadmus-part-general-ui, cadmus-ui.

### 2.0.1

- 2022-03-10: upgraded Angular to 13.2.6.
- added in `tsconfig.json` `"allowSyntheticDefaultImports": true` in order to work around [this issue](https://github.com/urish/ngx-moment/issues/275) in `ngx-moment`.

### 2.0.0

- 2022-03-01: upgraded Angular to 13.2.4.
- 2022-02-13: `ModelEditorComponentBase`: internally access `model` via private member rather than property setter/getter. Using the setter would unnecessarily trigger `onModelSet`.
- 2022-01-31: removed `DocReference`, `PhysicalDimension` and `PhysicalSize` interfaces from models (these are now in bricks). Upgraded Angular to 13.2.0.
- 2022-01-16: added `ChronotopesPart` to `cadmus-part-general-ui` and `cadmus-part-general-pg`. Image: 2.0.1.
- 2022-01-04: added `MetadataPart` to `cadmus-part-general-ui` and `cadmus-part-general-pg`. Removed physical size from `cadmus-ui` (now moved to bricks), increasing `cadmus-ui` version to 2.0.0.
- 2021-12-20: upgraded Angular and fixed ID passed via `getItemLayerInfo` in state library.
- 2021-12-18: recreated an Angular 13.0.4 workspace and moved old shell libraries into it while refactoring:
  - auth-related libraries replaced with `@myrmidon/auth-jwt-login` and `@myrmidon/auth-jwt-admin`.
  - base model editor slightly refactored to use new services.
  - generic models and their editors replaced with bricks.
  - comment part and fragment now uses `ExternalId`'s for IDs rather than an array of strings. This is also reflected in the backend models (`Cadmus.Parts` from version 2.7.0, `Cadmus.Seed.Parts` from version 1.5.0).
  - Cadmus material removed, and replaced by more granular imports in each Material consumer.

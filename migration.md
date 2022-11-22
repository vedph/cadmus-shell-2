# Migrating Code

## Part/Fragment Editors

1. pass `formBuilder` to the super ctor.
2. implement `ngOnInit` at least as (`initEditor` no more exists):

```ts
public override ngOnInit(): void {
  super.ngOnInit();
}
```

3. implement `buildForm` moving there the creation of the root form (previously in ctor):

```ts
protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
  return formBuilder.group({
    // ...
  });
}
```

4. change `onThesauriSet` into a private `updateThesauri` and call it from `onDataSet`, e.g.:

```ts
private updateThesauri(thesauri: ThesauriSet): void {
    let key = 'bibliography-languages';
    if (this.hasThesaurus(key)) {
      this.langEntries = thesauri[key].entries;
    } else {
      this.langEntries = undefined;
    }

    key = 'bibliography-types';
    if (this.hasThesaurus(key)) {
      this.typeEntries = thesauri[key].entries;
    } else {
      this.typeEntries = undefined;
    }
  }
```

5. ensure that `updateForm` is ok and call it from `OnDataSet`.

6. rename `onModelSet` to `onDataSet` and adjust it as required, like:

```ts
protected override onDataSet(data?: EditedObject<ChronotopesPart>): void {
  // thesauri
  if (data?.thesauri) {
    this.updateThesauri(data.thesauri);
  }

  // form
  this.updateForm(data?.value);
}
```

7. rename `getModelFromForm` to `getValue` and adjust, e.g.:

```ts
// for parts
protected getValue(): ChronotopesPart {
  let part = this.getEditedPart(CHRONOTOPES_PART_TYPEID) as ChronotopesPart;
  part.chronotopes = this.chronotopes.value;
  return part;
}

// for fragments
protected getValue(): OrthographyFragment {
  const fr = this.getEditedFragment() as OrthographyFragment;
  fr.standard = this.standard.value.trim();
  fr.operations = this.getOperations();
  return fr;
}
```

## Part Wrappers

1. remove all the state-related files.

2. replace the constructor:

```ts
import { EditPartFeatureBase, PartEditorService } from '@myrmidon/cadmus-state';
import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';

  constructor(
    router: Router,
    route: ActivatedRoute,
    snackbar: MatSnackBar,
    itemService: ItemService,
    thesaurusService: ThesaurusService,
    editorService: PartEditorService
  ) {
    super(
      router,
      route,
      snackbar,
      itemService,
      thesaurusService,
      editorService
    );
  }
```

3. replace `ngOnInit` with `getReqThesauriIds` override when thesauri are required, else just remove it:

```ts
protected override getReqThesauriIds(): string[] {
  return [
    'bibliography-languages',
    'bibliography-types',
    'bibliography-tags',
    'bibliography-author-roles',
  ];
}
```

4. change the template like this:

```html
<cadmus-current-item-bar></cadmus-current-item-bar>
<cadmus-bibliography-part
  [identity]="identity"
  [data]="$any(data)"
  (dataChange)="save($event)"
  (editorClose)="close()"
  (dirtyChange)="onDirtyChange($event)"
></cadmus-bibliography-part>
```

## Fragment Wrappers

1. remove all the state-related files.

2. replace the constructor:

```ts
  constructor(
    router: Router,
    route: ActivatedRoute,
    snackbar: MatSnackBar,
    editorService: FragmentEditorService,
    libraryRouteService: LibraryRouteService
  ) {
    super(router, route, snackbar, editorService, libraryRouteService);
  }
```

3. replace `ngOnInit` with `getReqThesauriIds` override when thesauri are required, else just remove it.

4. change the template like this:

```html
<cadmus-current-item-bar></cadmus-current-item-bar>
<div class="base-text">
  <cadmus-decorated-token-text
    [baseText]="data?.baseText || ''"
    [locations]="frLoc ? [frLoc] : []"
  ></cadmus-decorated-token-text>
</div>
<cadmus-chronology-fragment
  [data]="$any(data)"
  (dataChange)="save($event)"
  (editorClose)="close()"
  (dirtyChange)="onDirtyChange($event)"
></cadmus-chronology-fragment>
```

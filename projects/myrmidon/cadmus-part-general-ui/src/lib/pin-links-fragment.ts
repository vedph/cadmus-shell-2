import { Fragment } from '@myrmidon/cadmus-core';

import { PinLink } from './pin-links-part';

/**
 * The pin-based links layer fragment server model.
 */
export interface PinLinksFragment extends Fragment {
  links: PinLink[];
}

export const PIN_LINKS_FRAGMENT_TYPEID = 'fr.it.vedph.pin-links';

export const PIN_LINKS_FRAGMENT_SCHEMA = {
  definitions: {},
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id:
    'www.vedph.it/cadmus/fragments/<PRJ>/' +
    PIN_LINKS_FRAGMENT_TYPEID +
    '.json',
  type: 'object',
  title: 'PinLinksFragment',
  required: ['location', 'links'],
  properties: {
    location: {
      $id: '#/properties/location',
      type: 'string',
    },
    baseText: {
      $id: '#/properties/baseText',
      type: 'string',
    },
    links: {
      type: 'array',
      items: {
        type: 'object',
        default: {},
        required: ['label', 'itemId', 'partId', 'partTypeId', 'name', 'value'],
        properties: {
          label: {
            type: 'string',
          },
          itemId: {
            type: 'string',
          },
          partId: {
            type: 'string',
          },
          partTypeId: {
            type: 'string',
          },
          roleId: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          value: {
            type: 'string',
          },
          tag: {
            type: 'string',
          },
        },
      },
    },
  },
};

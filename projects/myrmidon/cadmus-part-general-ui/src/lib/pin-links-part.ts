import { Part } from '@myrmidon/cadmus-core';

/**
 * A link used in PinLinksPart.
 */
export interface PinLink {
  label: string;
  itemId: string;
  partId: string;
  partTypeId: string;
  roleId?: string;
  name: string;
  value: string;
  tag?: string;
}

/**
 * The PinLinks part model.
 */
export interface PinLinksPart extends Part {
  links: PinLink[];
}

/**
 * The type ID used to identify the PinLinksPart type.
 */
export const PIN_LINKS_PART_TYPEID = 'it.vedph.pin-links';

/**
 * JSON schema for the PinLinks part.
 * You can use the JSON schema tool at https://jsonschema.net/.
 */
export const PIN_LINKS_PART_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'www.vedph.it/cadmus/parts/general/' + PIN_LINKS_PART_TYPEID + '.json',
  type: 'object',
  title: 'PinLinksPart',
  required: [
    'id',
    'itemId',
    'typeId',
    'timeCreated',
    'creatorId',
    'timeModified',
    'userId',
    'links',
  ],
  properties: {
    timeCreated: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d+Z$',
    },
    creatorId: {
      type: 'string',
    },
    timeModified: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d+Z$',
    },
    userId: {
      type: 'string',
    },
    id: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    },
    itemId: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    },
    typeId: {
      type: 'string',
      pattern: '^[a-z][-0-9a-z._]*$',
    },
    roleId: {
      type: ['string', 'null'],
      pattern: '^([a-z][-0-9a-z._]*)?$',
    },

    links: {
      type: 'array',
      default: [],
      title: 'The links Schema',
      items: {
        type: 'object',
        default: {},
        title: 'A Schema',
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

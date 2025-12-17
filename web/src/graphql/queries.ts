import { gql } from 'urql';

export const STORES_QUERY = gql`
  query Stores {
    stores {
      id
      name
      location
    }
  }
`;

export const INVENTORY_ITEMS_QUERY = gql`
  query InventoryItems($filter: InventoryItemFilterInput, $page: Int, $pageSize: Int) {
    inventoryItems(filter: $filter, page: $page, pageSize: $pageSize) {
      pageInfo {
        page
        pageSize
        total
      }
      items {
        id
        price
        quantity
        inventoryValue
        store {
          id
          name
        }
        product {
          id
          name
          category
        }
      }
    }
  }
`;

export const STORE_DETAIL_QUERY = gql`
  query StoreDetail($id: ID!) {
    store(id: $id) {
      id
      name
      location
      inventoryItems {
        id
        price
        quantity
        inventoryValue
        product {
          id
          name
          category
        }
      }
    }
    storeInventorySummary(storeId: $id) {
      totalSkus
      totalQuantity
      totalValue
      lowStockCount
    }
  }
`;

export const UPSERT_INVENTORY_ITEM_MUTATION = gql`
  mutation UpsertInventoryItem($input: InventoryItemUpsertInput!) {
    upsertInventoryItem(input: $input) {
      id
      price
      quantity
      inventoryValue
      product {
        id
        name
        category
      }
      store {
        id
        name
      }
    }
  }
`;





export type TServicePagination = {
    servicesLimit: number;
    servicesPage: number;
    servicesSortOrder: "asc" | "desc";
    reviewLimit: number;
    reviewPage: number;
    reviewSortOrder: "asc" | "desc";
}
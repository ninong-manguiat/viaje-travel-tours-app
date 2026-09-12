// Type definitions for Next.js routes

/**
 * Internal types used by the Next.js router and Link component.
 * These types are not meant to be used directly.
 * @internal
 */
declare namespace __next_route_internal_types__ {
  type SearchOrHash = `?${string}` | `#${string}`
  type WithProtocol = `${string}:${string}`

  type Suffix = '' | SearchOrHash

  type SafeSlug<S extends string> = S extends `${string}/${string}`
    ? never
    : S extends `${string}${SearchOrHash}`
    ? never
    : S extends ''
    ? never
    : S

  type CatchAllSlug<S extends string> = S extends `${string}${SearchOrHash}`
    ? never
    : S extends ''
    ? never
    : S

  type OptionalCatchAllSlug<S extends string> =
    S extends `${string}${SearchOrHash}` ? never : S

  type StaticRoutes = 
    | `/`
    | `/admin`
    | `/admin/clients`
    | `/admin/documents`
    | `/admin/packages`
    | `/admin/payment-management`
    | `/admin/payments/verification`
    | `/admin/quotations`
    | `/admin/transactions/new`
    | `/api/bookings`
    | `/admin/bookings`
    | `/admin/website-content`
    | `/api/admin/document-bins`
    | `/api/admin/bookings`
    | `/api/admin/packages`
    | `/api/admin/email/test-send`
    | `/api/admin/payment-methods`
    | `/api/admin/website-content`
    | `/api/admin/website-content/upload`
    | `/api/admin/quotations`
    | `/api/booking-drafts`
    | `/api/bookings/payment-proof/upload`
    | `/customize-my-trip`
    | `/forgot-password`
    | `/flights`
    | `/dashboard`
    | `/dashboard/documents`
    | `/dashboard/transactions`
    | `/login`
    | `/packages`
  type DynamicRoutes<T extends string = string> = 
    | `/activate/${SafeSlug<T>}`
    | `/admin/clients/${SafeSlug<T>}`
    | `/admin/packages/${SafeSlug<T>}/edit`
    | `/admin/bookings/${SafeSlug<T>}`
    | `/api/admin/document-bins/${SafeSlug<T>}`
    | `/api/admin/bookings/${SafeSlug<T>}`
    | `/api/admin/bookings/${SafeSlug<T>}/confirmation-email`
    | `/api/admin/packages/${SafeSlug<T>}`
    | `/api/admin/payment-methods/${SafeSlug<T>}`
    | `/api/admin/quotations/${SafeSlug<T>}`
    | `/api/admin/quotations/${SafeSlug<T>}/send-email`
    | `/api/admin/payments/${SafeSlug<T>}`
    | `/api/booking-drafts/${SafeSlug<T>}`
    | `/api/documents/${SafeSlug<T>}/upload`
    | `/api/quotations/${SafeSlug<T>}/payment`
    | `/book/${SafeSlug<T>}`
    | `/book/${SafeSlug<T>}/payment`
    | `/documents/${SafeSlug<T>}`
    | `/guest-checkout/${SafeSlug<T>}`
    | `/dashboard/bookings/${SafeSlug<T>}`
    | `/dashboard/quotations/${SafeSlug<T>}`
    | `/packages/${SafeSlug<T>}`
    | `/quotation/${SafeSlug<T>}`
    | `/payment/quotation/${SafeSlug<T>}`

  type RouteImpl<T> = 
    | StaticRoutes
    | SearchOrHash
    | WithProtocol
    | `${StaticRoutes}${SearchOrHash}`
    | (T extends `${DynamicRoutes<infer _>}${Suffix}` ? T : never)
    
}

declare module 'next' {
  export { default } from 'next/types/index.js'
  export * from 'next/types/index.js'

  export type Route<T extends string = string> =
    __next_route_internal_types__.RouteImpl<T>
}

declare module 'next/link' {
  import type { LinkProps as OriginalLinkProps } from 'next/dist/client/link.js'
  import type { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'
  import type { UrlObject } from 'url'

  type LinkRestProps = Omit<
    Omit<
      DetailedHTMLProps<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        HTMLAnchorElement
      >,
      keyof OriginalLinkProps
    > &
      OriginalLinkProps,
    'href'
  >

  export type LinkProps<RouteInferType> = LinkRestProps & {
    /**
     * The path or URL to navigate to. This is the only required prop. It can also be an object.
     * @see https://nextjs.org/docs/api-reference/next/link
     */
    href: __next_route_internal_types__.RouteImpl<RouteInferType> | UrlObject
  }

  export default function Link<RouteType>(props: LinkProps<RouteType>): JSX.Element
}

declare module 'next/navigation' {
  export * from 'next/dist/client/components/navigation.js'

  import type { NavigateOptions, AppRouterInstance as OriginalAppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
  interface AppRouterInstance extends OriginalAppRouterInstance {
    /**
     * Navigate to the provided href.
     * Pushes a new history entry.
     */
    push<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>, options?: NavigateOptions): void
    /**
     * Navigate to the provided href.
     * Replaces the current history entry.
     */
    replace<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>, options?: NavigateOptions): void
    /**
     * Prefetch the provided href.
     */
    prefetch<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>): void
  }

  export declare function useRouter(): AppRouterInstance;
}

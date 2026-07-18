import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";

/** Open Stripe hosted checkout in the system / in-app browser. */
export async function openStripeCheckout(checkoutUrl: string): Promise<void> {
  const url = checkoutUrl.trim();
  if (!url) return;

  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      enableBarCollapsing: true,
    });
  } catch {
    await Linking.openURL(url);
  }
}

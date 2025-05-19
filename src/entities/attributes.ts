/**
 * Enumeration of reserved customer attributes.
 * @public
 */
export enum ReservedCustomerAttribute {
  /**
   * The display name that should be used to reference the customer.
   */
  DisplayName = "$displayName",
  /**
   * The email address of the customer.
   */
  Email = "$email",
  /**
   * The phone number of the customer.
   */
  PhoneNumber = "$phoneNumber",
  /**
   * iOS advertising identifier UUID for the customer.
   */
  IDFA = "$idfa",
  /**
   * iOS vender identifier UUID for the customer.
   */
  IDFV = "$idfv",
  /**
   * The advertising ID that is provided by Google Play services for the customer.
   */
  GPSAdId = "$gpsAdId",
  /**
   * The Android ID of the customer.
   */
  AndroidId = "$androidId",
  /**
   * The Amazon Advertising ID of the customer.
   */
  AmazonAdId = "$amazonAdId",
  /**
   * The IP address of the customer.
   */
  IP = "$ip",
  /**
   * The unique Adjust identifier for the customer.
   */
  AdjustId = "$adjustId",
  /**
   * The Amplitude device ID of the customer.
   */
  AmplitudeDeviceId = "$amplitudeDeviceId",
  /**
   * The Amplitude user ID of the customer.
   */
  AmplitudeUserId = "$amplitudeUserId",
  /**
   * Appsflyer Id. The unique Appsflyer identifier for the customer.
   */
  AppsflyerId = "$appsflyerId",
  /**
   * The AppsFlyer sharing filter of the customer.
   */
  AppsflyerSharingFilter = "$appsflyerSharingFilter",
  /**
   * The Branch ID of the customer.
   */
  BranchId = "$branchId",
  /**
   * The Braze 'alias_name' in User Alias Object.
   */
  BrazeAliasName = "$brazeAliasName",
  /**
   * The Braze 'alias_label' in User Alias Object.
   */
  BrazeAliasLabel = "$brazeAliasLabel",
  /**
   * The CleverTap ID of the customer.
   */
  ClevertapId = "$clevertapId",
  /**
   * The Facebook anonymous ID of the customer.
   */
  FbAnonId = "$fbAnonId",
  /**
   * The unique mParticle user identifier (mpid).
   */
  MparticleId = "$mparticleId",
  /**
   * The OneSignal Player Id for the customer.
   */
  OnesignalId = "$onesignalId",
  /**
   * The OneSignal user ID of the customer.
   */
  OnesignalUserId = "$onesignalUserId",
  /**
   * The Intercom contact ID of the customer.
   */
  IntercomContactId = "$intercomContactId",
  /**
   * The media source of the customer.
   */
  MediaSource = "$mediaSource",
  /**
   * The campaign of the customer.
   */
  Campaign = "$campaign",
  /**
   * The ad group of the customer.
   */
  AdGroup = "$adGroup",
  /**
   * The Ad ID of the customer.
   */
  AdId = "$ad",
  /**
   * The keyword of the customer.
   */
  Keyword = "$keyword",
  /**
   * The creative of the customer.
   */
  Creative = "$creative",
  /**
   * Apple push notification tokens for the customer.
   */
  APNSTokens = "$apnsTokens",
  /**
   * Google push notification tokens for the customer.
   */
  FCMTokens = "$fcmTokens",
  /**
   * The Airship channel ID of the customer.
   */
  AirshipChannelId = "$airshipChannelId",
  /**
   * The segment ID of the customer.
   */
  SegmentId = "$segmentId",
  /**
   * The Iterable user ID of the customer.
   */
  IterableUserId = "$iterableUserId",
  /**
   * The Iterable campaign ID of the customer.
   */
  IterableCampaignId = "$iterableCampaignId",
  /**
   * The Iterable template ID of the customer.
   */
  IterableTemplateId = "$iterableTemplateId",
  /**
   * The Firebase app instance ID of the customer.
   */
  FirebaseAppInstanceId = "$firebaseAppInstanceId",
  /**
   * The Mixpanel distinct ID of the customer.
   */
  MixpanelDistinctId = "$mixpanelDistinctId",
  /**
   * Apple App Tracking Transparency consent status for the customer.
   */
  ATTConsentStatus = "$attConsentStatus",
  /**
   * The unique Kochava device identifier of the customer.
   */
  KochavaDeviceId = "$kochavaDeviceId",
  /**
   * The device version of the customer.
   */
  DeviceVersion = "$deviceVersion",
  /**
   * The PostHog user ID of the customer.
   */
  PosthogUserId = "$posthogUserId",
  /**
   * The Telemetry Deck user ID of the customer.
   */
  TelemetryDeckUserId = "$telemetryDeckUserId",
  /**
   * The Telemetry Deck app ID of the customer.
   */
  TelemetryDeckAppId = "$telemetryDeckAppId",
  /**
   * The Apple refund handling preference of the customer.
   */
  AppleRefundHandlingPreference = "$appleRefundHandlingPreference",
  /**
   * The customer.io ID of the customer.
   */
  CustomerioId = "$customerioId",
  /**
   * The Tenjin ID of the customer.
   */
  TenjinId = "$tenjinId",
}

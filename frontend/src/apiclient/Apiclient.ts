import {
  AdminLoginData,
  AdminLoginError,
  AdminLoginRequest,
  AdminLogoutData,
  AdminLogoutError,
  AdminVerifyData,
  AdminVerifyError,
  AdminVerifyRequest,
  CheckHealthData,
  CreateEventData,
  CreateEventError,
  CreateEventRequest,
  DeleteEventData,
  DeleteEventError,
  DeleteEventParams,
  DeleteOverrideData,
  DeleteOverrideError,
  DeleteOverrideParams,
  DownloadAudioData,
  DownloadAudioError,
  DownloadRequest,
  GetAllOverridesData,
  GetEventsData,
  GetOverrideData,
  GetOverrideError,
  GetOverrideParams,
  GetSermonsData,
  GetSermonsError,
  GetSermonsParams,
  GetTranscriptRouteData,
  GetTranscriptRouteError,
  GetTranscriptRouteParams,
  SaveOverrideData,
  SaveOverrideError,
  SaveOverrideParams,
  SermonOverride,
  UpdateEventData,
  UpdateEventError,
  UpdateEventParams,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Apiclient<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Verify admin password and return a session token.
   *
   * @tags admin-auth, dbtn/module:admin_auth
   * @name admin_login
   * @summary Admin Login
   * @request POST:/routes/admin-auth/login
   */
  admin_login = (data: AdminLoginRequest, params: RequestParams = {}) =>
    this.request<AdminLoginData, AdminLoginError>({
      path: `/routes/admin-auth/login`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if a session token is still valid.
   *
   * @tags admin-auth, dbtn/module:admin_auth
   * @name admin_verify
   * @summary Admin Verify
   * @request POST:/routes/admin-auth/verify
   */
  admin_verify = (data: AdminVerifyRequest, params: RequestParams = {}) =>
    this.request<AdminVerifyData, AdminVerifyError>({
      path: `/routes/admin-auth/verify`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Invalidate a session token.
   *
   * @tags admin-auth, dbtn/module:admin_auth
   * @name admin_logout
   * @summary Admin Logout
   * @request POST:/routes/admin-auth/logout
   */
  admin_logout = (data: AdminVerifyRequest, params: RequestParams = {}) =>
    this.request<AdminLogoutData, AdminLogoutError>({
      path: `/routes/admin-auth/logout`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:youtube
   * @name get_sermons
   * @summary Get Sermons
   * @request GET:/routes/sermons
   */
  get_sermons = (query: GetSermonsParams, params: RequestParams = {}) =>
    this.request<GetSermonsData, GetSermonsError>({
      path: `/routes/sermons`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:youtube
   * @name get_transcript_route
   * @summary Get Transcript Route
   * @request GET:/routes/transcript/{video_id}
   */
  get_transcript_route = ({ videoId, ...query }: GetTranscriptRouteParams, params: RequestParams = {}) =>
    this.request<GetTranscriptRouteData, GetTranscriptRouteError>({
      path: `/routes/transcript/${videoId}`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:download_audio
   * @name download_audio
   * @summary Download Audio
   * @request POST:/routes/download_audio
   */
  download_audio = (data: DownloadRequest, params: RequestParams = {}) =>
    this.request<DownloadAudioData, DownloadAudioError>({
      path: `/routes/download_audio`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Retrieve all sermon overrides from storage.
   *
   * @tags dbtn/module:sermon_manager
   * @name get_all_overrides
   * @summary Get All Overrides
   * @request GET:/routes/sermon-overrides
   */
  get_all_overrides = (params: RequestParams = {}) =>
    this.request<GetAllOverridesData, any>({
      path: `/routes/sermon-overrides`,
      method: "GET",
      ...params,
    });

  /**
   * @description Retrieve a specific sermon override from storage.
   *
   * @tags dbtn/module:sermon_manager
   * @name get_override
   * @summary Get Override
   * @request GET:/routes/sermon-overrides/{video_id}
   */
  get_override = ({ videoId, ...query }: GetOverrideParams, params: RequestParams = {}) =>
    this.request<GetOverrideData, GetOverrideError>({
      path: `/routes/sermon-overrides/${videoId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Save or update a sermon override in storage.
   *
   * @tags dbtn/module:sermon_manager
   * @name save_override
   * @summary Save Override
   * @request POST:/routes/sermon-overrides/{video_id}
   */
  save_override = ({ videoId, ...query }: SaveOverrideParams, data: SermonOverride, params: RequestParams = {}) =>
    this.request<SaveOverrideData, SaveOverrideError>({
      path: `/routes/sermon-overrides/${videoId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a sermon override from storage.
   *
   * @tags dbtn/module:sermon_manager
   * @name delete_override
   * @summary Delete Override
   * @request DELETE:/routes/sermon-overrides/{video_id}
   */
  delete_override = ({ videoId, ...query }: DeleteOverrideParams, params: RequestParams = {}) =>
    this.request<DeleteOverrideData, DeleteOverrideError>({
      path: `/routes/sermon-overrides/${videoId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Return all stored events.
   *
   * @tags dbtn/module:events_manager
   * @name get_events
   * @summary Get Events
   * @request GET:/routes/events/get-events
   */
  get_events = (params: RequestParams = {}) =>
    this.request<GetEventsData, any>({
      path: `/routes/events/get-events`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add a new event.
   *
   * @tags dbtn/module:events_manager
   * @name create_event
   * @summary Create Event
   * @request POST:/routes/events/create-event
   */
  create_event = (data: CreateEventRequest, params: RequestParams = {}) =>
    this.request<CreateEventData, CreateEventError>({
      path: `/routes/events/create-event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update an existing event by ID.
   *
   * @tags dbtn/module:events_manager
   * @name update_event
   * @summary Update Event
   * @request PUT:/routes/events/update-event/{event_id}
   */
  update_event = ({ eventId, ...query }: UpdateEventParams, data: CreateEventRequest, params: RequestParams = {}) =>
    this.request<UpdateEventData, UpdateEventError>({
      path: `/routes/events/update-event/${eventId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete an event by ID.
   *
   * @tags dbtn/module:events_manager
   * @name delete_event
   * @summary Delete Event
   * @request DELETE:/routes/events/delete-event/{event_id}
   */
  delete_event = ({ eventId, ...query }: DeleteEventParams, params: RequestParams = {}) =>
    this.request<DeleteEventData, DeleteEventError>({
      path: `/routes/events/delete-event/${eventId}`,
      method: "DELETE",
      ...params,
    });
}

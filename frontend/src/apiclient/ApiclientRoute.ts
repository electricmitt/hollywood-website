import {
  AdminLoginData,
  AdminLoginRequest,
  AdminLogoutData,
  AdminVerifyData,
  AdminVerifyRequest,
  CheckHealthData,
  CreateEventData,
  CreateEventRequest,
  DeleteEventData,
  DeleteOverrideData,
  DownloadAudioData,
  DownloadRequest,
  GetAllOverridesData,
  GetEventsData,
  GetOverrideData,
  GetSermonsData,
  GetTranscriptRouteData,
  SaveOverrideData,
  SermonOverride,
  UpdateEventData,
} from "./data-contracts";

export namespace Apiclient {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Verify admin password and return a session token.
   * @tags admin-auth, dbtn/module:admin_auth
   * @name admin_login
   * @summary Admin Login
   * @request POST:/routes/admin-auth/login
   */
  export namespace admin_login {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AdminLoginRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AdminLoginData;
  }

  /**
   * @description Check if a session token is still valid.
   * @tags admin-auth, dbtn/module:admin_auth
   * @name admin_verify
   * @summary Admin Verify
   * @request POST:/routes/admin-auth/verify
   */
  export namespace admin_verify {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AdminVerifyRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AdminVerifyData;
  }

  /**
   * @description Invalidate a session token.
   * @tags admin-auth, dbtn/module:admin_auth
   * @name admin_logout
   * @summary Admin Logout
   * @request POST:/routes/admin-auth/logout
   */
  export namespace admin_logout {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AdminVerifyRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AdminLogoutData;
  }

  /**
   * No description
   * @tags dbtn/module:youtube
   * @name get_sermons
   * @summary Get Sermons
   * @request GET:/routes/sermons
   */
  export namespace get_sermons {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Playlistid */
      playlistId: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSermonsData;
  }

  /**
   * No description
   * @tags dbtn/module:youtube
   * @name get_transcript_route
   * @summary Get Transcript Route
   * @request GET:/routes/transcript/{video_id}
   */
  export namespace get_transcript_route {
    export type RequestParams = {
      /** Video Id */
      videoId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTranscriptRouteData;
  }

  /**
   * No description
   * @tags dbtn/module:download_audio
   * @name download_audio
   * @summary Download Audio
   * @request POST:/routes/download_audio
   */
  export namespace download_audio {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = DownloadRequest;
    export type RequestHeaders = {};
    export type ResponseBody = DownloadAudioData;
  }

  /**
   * @description Retrieve all sermon overrides from storage.
   * @tags dbtn/module:sermon_manager
   * @name get_all_overrides
   * @summary Get All Overrides
   * @request GET:/routes/sermon-overrides
   */
  export namespace get_all_overrides {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAllOverridesData;
  }

  /**
   * @description Retrieve a specific sermon override from storage.
   * @tags dbtn/module:sermon_manager
   * @name get_override
   * @summary Get Override
   * @request GET:/routes/sermon-overrides/{video_id}
   */
  export namespace get_override {
    export type RequestParams = {
      /** Video Id */
      videoId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetOverrideData;
  }

  /**
   * @description Save or update a sermon override in storage.
   * @tags dbtn/module:sermon_manager
   * @name save_override
   * @summary Save Override
   * @request POST:/routes/sermon-overrides/{video_id}
   */
  export namespace save_override {
    export type RequestParams = {
      /** Video Id */
      videoId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = SermonOverride;
    export type RequestHeaders = {};
    export type ResponseBody = SaveOverrideData;
  }

  /**
   * @description Delete a sermon override from storage.
   * @tags dbtn/module:sermon_manager
   * @name delete_override
   * @summary Delete Override
   * @request DELETE:/routes/sermon-overrides/{video_id}
   */
  export namespace delete_override {
    export type RequestParams = {
      /** Video Id */
      videoId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteOverrideData;
  }

  /**
   * @description Return all stored events.
   * @tags dbtn/module:events_manager
   * @name get_events
   * @summary Get Events
   * @request GET:/routes/events/get-events
   */
  export namespace get_events {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetEventsData;
  }

  /**
   * @description Add a new event.
   * @tags dbtn/module:events_manager
   * @name create_event
   * @summary Create Event
   * @request POST:/routes/events/create-event
   */
  export namespace create_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateEventRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateEventData;
  }

  /**
   * @description Update an existing event by ID.
   * @tags dbtn/module:events_manager
   * @name update_event
   * @summary Update Event
   * @request PUT:/routes/events/update-event/{event_id}
   */
  export namespace update_event {
    export type RequestParams = {
      /** Event Id */
      eventId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = CreateEventRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateEventData;
  }

  /**
   * @description Delete an event by ID.
   * @tags dbtn/module:events_manager
   * @name delete_event
   * @summary Delete Event
   * @request DELETE:/routes/events/delete-event/{event_id}
   */
  export namespace delete_event {
    export type RequestParams = {
      /** Event Id */
      eventId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteEventData;
  }
}

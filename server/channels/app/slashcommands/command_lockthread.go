// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package slashcommands

import (
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/i18n"
	"github.com/mattermost/mattermost/server/public/shared/request"
	"github.com/mattermost/mattermost/server/v8/channels/app"
)

type LockThreadProvider struct {
}

const (
	CmdLockThread = "lockthread"
)

func init() {
	app.RegisterCommandProvider(&LockThreadProvider{})
}

func (*LockThreadProvider) GetTrigger() string {
	return CmdLockThread
}

func (*LockThreadProvider) GetCommand(a *app.App, T i18n.TranslateFunc) *model.Command {
	return &model.Command{
		Trigger:          CmdLockThread,
		AutoComplete:     true,
		AutoCompleteDesc: T("api.command_lockthread.desc"),
		AutoCompleteHint: T("api.command_lockthread.hint"),
		DisplayName:      T("api.command_lockthread.name"),
	}
}

func (*LockThreadProvider) DoCommand(a *app.App, rctx request.CTX, args *model.CommandArgs, message string) *model.CommandResponse {
	// The command must be run from within a thread so we know which root post to lock.
	if args.RootId == "" {
		return &model.CommandResponse{
			Text:         args.T("api.command_lockthread.not_in_thread.app_error"),
			ResponseType: model.CommandResponseTypeEphemeral,
		}
	}

	// Only channel/team/system admins may lock or unlock a thread.
	if ok, _ := a.HasPermissionToChannel(rctx, args.UserId, args.ChannelId, model.PermissionManageChannelRoles); !ok {
		return &model.CommandResponse{
			Text:         args.T("api.command_lockthread.permission.app_error"),
			ResponseType: model.CommandResponseTypeEphemeral,
		}
	}

	rootPost, err := a.GetSinglePost(rctx, args.RootId, false)
	if err != nil {
		return &model.CommandResponse{
			Text:         args.T("api.command_lockthread.root_post.app_error"),
			ResponseType: model.CommandResponseTypeEphemeral,
		}
	}

	// Toggle the current lock state.
	lock := !rootPost.IsThreadLocked()

	if _, err := a.SetThreadLocked(rctx, rootPost, lock); err != nil {
		return &model.CommandResponse{
			Text:         args.T("api.command_lockthread.update.app_error"),
			ResponseType: model.CommandResponseTypeEphemeral,
		}
	}

	text := args.T("api.command_lockthread.unlocked.success")
	if lock {
		text = args.T("api.command_lockthread.locked.success")
	}

	return &model.CommandResponse{
		Text:         text,
		ResponseType: model.CommandResponseTypeEphemeral,
	}
}

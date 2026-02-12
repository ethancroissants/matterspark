// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package oauthoauth2

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/mlog"
	"github.com/mattermost/mattermost/server/public/shared/request"
	"github.com/mattermost/mattermost/server/v8/einterfaces"
)

type OAuth2Provider struct{}

// OAuth2User represents a generic OAuth 2.0 user info response.
// Supports many common field names returned by various OAuth providers.
type OAuth2User struct {
	// Common ID fields
	Id  json.Number `json:"id"`
	Sub string      `json:"sub"`
	UID string      `json:"uid"`

	// Common email fields
	Email string `json:"email"`

	// Common username fields
	Username          string `json:"username"`
	Login             string `json:"login"`
	PreferredUsername  string `json:"preferred_username"`

	// Common name fields
	Name       string `json:"name"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	GivenName  string `json:"given_name"`
	FamilyName string `json:"family_name"`
}

func init() {
	provider := &OAuth2Provider{}
	einterfaces.RegisterOAuthProvider(model.ServiceOAuth2, provider)
}

func (u *OAuth2User) getAuthData() string {
	// Prefer sub (OpenID-style), then id, then uid
	if u.Sub != "" {
		return u.Sub
	}
	if u.Id.String() != "" && u.Id.String() != "0" {
		return u.Id.String()
	}
	if u.UID != "" {
		return u.UID
	}
	// Fallback to email as auth data
	return u.Email
}

func (u *OAuth2User) getUsername() string {
	if u.Username != "" {
		return u.Username
	}
	if u.Login != "" {
		return u.Login
	}
	if u.PreferredUsername != "" {
		return u.PreferredUsername
	}
	// Derive from email
	if u.Email != "" {
		parts := strings.Split(u.Email, "@")
		return parts[0]
	}
	return u.getAuthData()
}

func (u *OAuth2User) getFirstName() string {
	if u.FirstName != "" {
		return u.FirstName
	}
	if u.GivenName != "" {
		return u.GivenName
	}
	if u.Name != "" {
		parts := strings.Fields(u.Name)
		if len(parts) > 0 {
			return parts[0]
		}
	}
	return ""
}

func (u *OAuth2User) getLastName() string {
	if u.LastName != "" {
		return u.LastName
	}
	if u.FamilyName != "" {
		return u.FamilyName
	}
	if u.Name != "" {
		parts := strings.Fields(u.Name)
		if len(parts) > 1 {
			return strings.Join(parts[1:], " ")
		}
	}
	return ""
}

func (u *OAuth2User) IsValid() error {
	if u.getAuthData() == "" {
		return errors.New("user id/sub is empty")
	}
	if u.Email == "" {
		return errors.New("user email is empty")
	}
	return nil
}

func userFromOAuth2User(logger mlog.LoggerIFace, u *OAuth2User) *model.User {
	user := &model.User{}
	user.Username = model.CleanUsername(logger, u.getUsername())
	user.FirstName = u.getFirstName()
	user.LastName = u.getLastName()
	user.Email = strings.ToLower(u.Email)
	authData := u.getAuthData()
	user.AuthData = &authData
	user.AuthService = model.ServiceOAuth2
	return user
}

func oauth2UserFromJSON(data io.Reader) (*OAuth2User, error) {
	var u OAuth2User
	if err := json.NewDecoder(data).Decode(&u); err != nil {
		return nil, fmt.Errorf("failed to decode OAuth2 user info: %w", err)
	}
	return &u, nil
}

func (p *OAuth2Provider) GetUserFromJSON(rctx request.CTX, data io.Reader, tokenUser *model.User) (*model.User, error) {
	u, err := oauth2UserFromJSON(data)
	if err != nil {
		return nil, err
	}
	if err = u.IsValid(); err != nil {
		return nil, err
	}
	return userFromOAuth2User(rctx.Logger(), u), nil
}

func (p *OAuth2Provider) GetSSOSettings(_ request.CTX, config *model.Config, service string) (*model.SSOSettings, error) {
	return config.GetSSOService(service), nil
}

func (p *OAuth2Provider) GetUserFromIdToken(_ request.CTX, idToken string) (*model.User, error) {
	// Plain OAuth 2.0 does not use ID tokens
	return nil, nil
}

func (p *OAuth2Provider) IsSameUser(_ request.CTX, dbUser, oauthUser *model.User) bool {
	return dbUser.AuthData != nil && oauthUser.AuthData != nil && *dbUser.AuthData == *oauthUser.AuthData
}

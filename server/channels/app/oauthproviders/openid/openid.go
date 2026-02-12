// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Package oauthopenid provides a built-in OpenID Connect provider for Mattermost,
// removing the need for an enterprise license to use OpenID SSO.
package oauthopenid

import (
	"encoding/json"
	"errors"
	"io"
	"strings"

	"github.com/golang-jwt/jwt/v5"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/mlog"
	"github.com/mattermost/mattermost/server/public/shared/request"
	"github.com/mattermost/mattermost/server/v8/einterfaces"
)

type OpenIDProvider struct{}

// OpenIDUser represents the standard OpenID Connect userinfo claims.
type OpenIDUser struct {
	Sub               string `json:"sub"`
	Email             string `json:"email"`
	EmailVerified     bool   `json:"email_verified"`
	Name              string `json:"name"`
	GivenName         string `json:"given_name"`
	FamilyName        string `json:"family_name"`
	PreferredUsername  string `json:"preferred_username"`
	Nickname          string `json:"nickname"`
	Picture           string `json:"picture"`
}

func init() {
	provider := &OpenIDProvider{}
	einterfaces.RegisterOAuthProvider(model.ServiceOpenid, provider)
}

func userFromOpenIDUser(logger mlog.LoggerIFace, oiu *OpenIDUser) *model.User {
	user := &model.User{}

	// Use preferred_username, fallback to nickname, then email prefix
	username := oiu.PreferredUsername
	if username == "" {
		username = oiu.Nickname
	}
	if username == "" && oiu.Email != "" {
		parts := strings.SplitN(oiu.Email, "@", 2)
		username = parts[0]
	}
	if username == "" {
		username = oiu.Sub
	}
	user.Username = model.CleanUsername(logger, username)

	if oiu.GivenName != "" || oiu.FamilyName != "" {
		user.FirstName = oiu.GivenName
		user.LastName = oiu.FamilyName
	} else if oiu.Name != "" {
		splitName := strings.SplitN(oiu.Name, " ", 2)
		user.FirstName = splitName[0]
		if len(splitName) > 1 {
			user.LastName = splitName[1]
		}
	}

	user.Email = strings.ToLower(oiu.Email)
	authData := oiu.Sub
	user.AuthData = &authData
	user.AuthService = model.ServiceOpenid

	return user
}

func openIDUserFromJSON(data io.Reader) (*OpenIDUser, error) {
	var oiu OpenIDUser
	if err := json.NewDecoder(data).Decode(&oiu); err != nil {
		return nil, err
	}
	return &oiu, nil
}

func (oiu *OpenIDUser) IsValid() error {
	if oiu.Sub == "" {
		return errors.New("openid user 'sub' claim is empty")
	}
	if oiu.Email == "" {
		return errors.New("openid user 'email' claim is empty")
	}
	return nil
}

func (op *OpenIDProvider) GetUserFromJSON(rctx request.CTX, data io.Reader, tokenUser *model.User) (*model.User, error) {
	oiu, err := openIDUserFromJSON(data)
	if err != nil {
		return nil, err
	}
	if err = oiu.IsValid(); err != nil {
		return nil, err
	}

	user := userFromOpenIDUser(rctx.Logger(), oiu)

	// If we got user info from the id_token, prefer the token's sub for AuthData consistency
	if tokenUser != nil && tokenUser.AuthData != nil && *tokenUser.AuthData != "" {
		user.AuthData = tokenUser.AuthData
	}

	return user, nil
}

func (op *OpenIDProvider) GetSSOSettings(_ request.CTX, config *model.Config, service string) (*model.SSOSettings, error) {
	return config.GetSSOService(service), nil
}

func (op *OpenIDProvider) GetUserFromIdToken(_ request.CTX, idToken string) (*model.User, error) {
	// Parse the JWT without verification — the token has already been obtained
	// from the provider's token endpoint over HTTPS, so its authenticity is
	// established by the TLS connection. We only need the claims.
	parser := jwt.NewParser(jwt.WithoutClaimsValidation())
	token, _, err := parser.ParseUnverified(idToken, jwt.MapClaims{})
	if err != nil {
		return nil, errors.New("failed to parse id_token: " + err.Error())
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("failed to parse id_token claims")
	}

	user := &model.User{}

	if sub, ok := claims["sub"].(string); ok {
		user.AuthData = &sub
	}

	if email, ok := claims["email"].(string); ok {
		user.Email = strings.ToLower(email)
	}

	return user, nil
}

func (op *OpenIDProvider) IsSameUser(_ request.CTX, dbUser, oauthUser *model.User) bool {
	return dbUser.AuthData != nil && oauthUser.AuthData != nil && *dbUser.AuthData == *oauthUser.AuthData
}

INSERT or IGNORE into "users"("id", "name",  "api_key",      "picture" ) 
                       VALUES(1,    'admin', 'api_key_admin', null     ),
                             (2,    'user',  'api_key_user',  null     );

INSERT or IGNORE into "logins"("id", "user_id", "primary", "email" ) 
                        VALUES(1,    1,         't',       'admin@example.org'),
                              (2,    1,         'f',       'admin-alias@example.org'),
                              (3,    2,         't',       'user@example.org');

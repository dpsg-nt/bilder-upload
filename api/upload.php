<?php

require_once('./config.php');

/*
Some documentation how uploads work:
- The client requests this file with a POST and a json payload that contains the fields "name" and "file".
- This will use the stored refresh_token to get an access_token and create an upload ticket on onedrive
- The url to upload the file to onedrive is returned to the client
- The client will then use the upload url to upload the file

Some documentation how the refresh_token flow works:
- When this file is requested with GET, the browser will be redirected to Microsoft login and requests full access to OneDrive
- The user will accept
- The server will validate whether the user is the one that should update the refresh_token
- If valid, the refresh_token is stored in a file, and valid up to one year
- It is important to ensure that not everyone can update the refresh_token, otherwise an attacker could swap out the refresh_token
  and from there on all uploads will land in the OneDrive of the attacker.

Documentation and links:
- https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps (App registration for OAuth flow)
- https://docs.microsoft.com/en-us/onedrive/developer/rest-api/getting-started/app-registration (App registraiton documentation)
- https://docs.microsoft.com/en-us/onedrive/developer/rest-api/getting-started/graph-oauth (Authentication documentation)
- https://docs.microsoft.com/en-us/onedrive/developer/rest-api/api/driveitem_createuploadsession (File uploads that don't require authentication)
- https://stackoverflow.com/questions/60249556/uploading-and-downloading-files-on-onedrive-via-my-website-with-php (Simple file upload example)
*/

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

if($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit();

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    $redirect_uri = explode('?', $_SERVER['REQUEST_SCHEME'].'://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'])[0];

    if(count($_GET) == 0) {
        header('Location: https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id='.MICROSOFT_GRAPH_CLIENT_ID.'&response_type=code'.
        '&scope=offline_access Files.ReadWrite.All User.Read&redirect_uri='.$redirect_uri);
        exit();
    }

    if(empty($_GET['code'])) {
        var_dump($_GET);
        exit();
    }

    $curl = curl_init('https://login.microsoftonline.com/common/oauth2/v2.0/token');
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, array(
        'client_id' => MICROSOFT_GRAPH_CLIENT_ID,
        'client_secret' => MICROSOFT_GRAPH_CLIENT_SECRET,
        'grant_type' => 'authorization_code',
        'code' => $_GET['code'],
        'scope' => 'offline_access Files.ReadWrite.All User.Read',
        'redirect_uri' => $redirect_uri
    ));
    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if($status != 200) {
        var_dump($response);
        exit();
    }

    $tokens = json_decode($response);

    // detect if the user is authorized to update the refresh token
    $curl = curl_init('https://graph.microsoft.com/v1.0/me');
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HTTPHEADER, array(
        'Authorization: Bearer '.$tokens->access_token,
    ));
    $response = curl_exec($curl);

    $user = json_decode($response);
    
    if($user->userPrincipalName != MICROSOFT_ACCOUNT_USERNAME) {
        //var_dump($user);
        die('The user is not allowed to update the credentials for uploading images.');
    }

    file_put_contents('./config.microsoft-refresh-token.secret', $tokens->refresh_token);
    echo "Successfully updated refresh_token.";
    exit();
}

// -------------------------------------------------------------------------------------------------
// When we reach this point we should try to upload the posted file.

// request access_token
$curl = curl_init('https://login.microsoftonline.com/common/oauth2/v2.0/token');
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, array(
    'client_id' => MICROSOFT_GRAPH_CLIENT_ID,
    'client_secret' => MICROSOFT_GRAPH_CLIENT_SECRET,
    'grant_type' => 'refresh_token',
    'refresh_token' => file_get_contents('./config.microsoft-refresh-token.secret'),
    'scope' => 'offline_access Files.ReadWrite.All User.Read'
));
$response = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if($status != 200) {
    var_dump($response);
    die("Failed to get a refresh token.");
}

$tokens = json_decode($response);
// Update the refresh token, this will help that the token does not expire at some point.
file_put_contents('./config.microsoft-refresh-token.secret', $tokens->refresh_token);

// create an upload session
$request_body = file_get_contents('php://input');
$data = json_decode($request_body);

// We sanitize the input to prevent any attackers from executing path traversals, or similar things.
$name = preg_replace('/[^a-z0-9\.\-\ \(\)]/i', '_', $data->name);
$file = preg_replace('/[^a-z0-9\.\-]/i', '_', $data->file);

$curl = curl_init('https://graph.microsoft.com/v1.0/me/drive/root:'.MICROSOFT_ONEDRIVE_BASE_FOLDER.'/'.rawurlencode($name).'/'.$file.':/createUploadSession');
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer '.$tokens->access_token,
    'Content-Type: application/json'
));
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode(array(
    'item' => array(
        '@odata.type' => 'microsoft.graph.driveItemUploadableProperties',
        '@microsoft.graph.conflictBehavior' => 'replace',
        'name' => $file
    )
)));
$response = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

echo json_encode(array(
    'uploadUrl' => json_decode($response)->uploadUrl
));

<?php

if (isset($_POST['createAccount']))
    $jsonUserData = $_POST['createAccount'];
else if (isset($_POST['uniqueUN']))
    $sUsername = $_POST['uniqueUN'];
else if (isset($_POST['login']))
    $jsonCredentials = $_POST['login'];

if ($jsonUserData)
    $sFeedback = createAccount ($jsonUserData);
else if ($sUsername)
    $sFeedback = uniqueUN ($sUsername);
else if ($jsonCredentials)
    $sFeedback = login ($jsonCredentials);

echo $sFeedback;

function createAccount ($jsonUserData) {
    $objUserData = json_decode($jsonUserData);

    $dbhost = 'localhost';
    $dbuser = 'jake_video_chat';
    $dbpass = 'vvVN0EEADb4ZI';
    $db = "VideoChat";
    $dbconnect = new mysqli($dbhost, $dbuser, $dbpass, $db);

    $stmtI = $dbconnect->prepare("INSERT INTO Users (username, password, info) VALUES (?, ?, ?)");
    $stmtI->bind_param("sss", $objUserData->username, $objUserData->password, json_encode($objUserData->info));
    $stmtI->execute();
    $stmtI->close();

    $stmtS = $dbconnect->prepare("SELECT * FROM Users WHERE username=?");
    $stmtS->bind_param("s", $objUserData->username);
    $stmtS->execute();
    $tResult = $stmtS->get_result();
    $row = $tResult->fetch_assoc();
    $dbconnect->close();

    return $row["id"];
}

function uniqueUN ($sUsername) {
    $dbhost = 'localhost';
    $dbuser = 'jake_video_chat';
    $dbpass = 'vvVN0EEADb4ZI';
    $db = "VideoChat";
    $dbconnect = new mysqli($dbhost, $dbuser, $dbpass, $db);

    $stmt = $dbconnect->prepare("SELECT * FROM Users WHERE username=?");
    $stmt->bind_param("s", $sUsername);
    $stmt->execute();
    $tResult = $stmt->get_result();
    $stmt->close();
    $dbconnect->close();

    return 0 == $tResult->num_rows ? $sUsername : null;
}

function login ($jsonCredentials) {
    $objCredentials = json_decode($jsonCredentials);
    $dbhost = 'localhost';
    $dbuser = 'jake_video_chat';
    $dbpass = 'vvVN0EEADb4ZI';
    $db = "VideoChat";
    $dbconnect = new mysqli($dbhost, $dbuser, $dbpass, $db);

    $stmt = $dbconnect->prepare("SELECT * FROM Users WHERE username=? AND password=?");
    $stmt->bind_param("ss", $objCredentials->username, $objCredentials->password);
    $stmt->execute();
    $tResult = $stmt->get_result();
    $row = $tResult->fetch_assoc();
    $stmt->close();
    $dbconnect->close();

    if (1 != $tResult->num_rows)
        return false;

    $sSQL = "UPDATE Users SET lastlogin=CURRENT_TIMESTAMP WHERE id=" . $row["id"];
    QueryDB ($sSQL);

    $objUserData = new stdClass();
    $objUserData->id= $row["id"];
    $objUserData->info = $row["info"];
    $objUserData->lastlogin = $row["lastlogin"];
    $objUserData->created = $row["created"];

    return json_encode($objUserData);
}

function QueryDB ($sSQL) {
    $dbhost = 'localhost';
    $dbuser = 'jake_video_chat';
    $dbpass = 'vvVN0EEADb4ZI';
    $db = "VideoChat";
    $dbconnect = new mysqli($dbhost, $dbuser, $dbpass, $db);
    $Result = $dbconnect->query($sSQL);
    $dbconnect->close();
    return $Result;
}

?>

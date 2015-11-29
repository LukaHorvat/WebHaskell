{-# LANGUAGE DataKinds, TypeOperators, OverloadedStrings, TemplateHaskell #-}
module Main where

import Lib
import Servant
import Servant.HTML.Lucid
import Servant.JQuery
import Servant.PureScript
import Lucid
import Control.Monad.Trans.Either
import Network.Wai
import Network.Wai.Handler.Warp
import Data.Text (Text)
import qualified Data.Text as Text
import Text.RawString.QQ
import Data.Aeson.TH

type Route = Get '[HTML] (Html ())
        :<|> ReverseAPI
type ReverseAPI = "reverse" :> QueryParam "strToRev" String :> Get '[JSON] Text
             :<|> "getColor" :> Get '[JSON] Color

data Color = Red | Green | Blue deriving (Read, Show, Eq, Ord)

deriveJSON defaultOptions ''Color

server :: Server Route
server = return
    ( doctypehtml_ $ do
         head_ $ do
             script_ [type_ "text/javascript", src_ "script.js"] ("" :: Text)
             script_ (Text.pack $ jsForAPI (Proxy :: Proxy ReverseAPI))
         body_ ""
    )
    :<|> (\(Just str) -> return (Text.pack $ reverse str))
    :<|> return Red

app :: Application
app = serve (Proxy :: Proxy Route) server

writePS :: FilePath -> [AjaxReq] -> IO ()
writePS fp functions = writeFile fp $
    generatePSModule Servant.PureScript.defaultSettings "App" functions

rev :<|> col = jquery (Proxy :: Proxy ReverseAPI)

main :: IO ()
main = do
    writePS "test.purs" [rev, col]
    run 8080 app

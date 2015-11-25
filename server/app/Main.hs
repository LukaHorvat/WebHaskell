{-# LANGUAGE DataKinds, TypeOperators #-}
module Main where

import Lib
import Servant
import Control.Monad.Trans.Either
import Network.Wai
import Network.Wai.Handler.Warp
import Data.Text (Text)
import qualified Data.Text as Text

type ReverseAPI = "reverse" :> Capture "strToRev" String :> Get '[PlainText] Text

server :: String -> EitherT ServantErr IO Text
server str = return $ Text.pack $ reverse str

app :: Application
app = serve (Proxy :: Proxy ReverseAPI) server

main :: IO ()
main = run 8080 app

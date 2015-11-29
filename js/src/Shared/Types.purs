module Shared.Instances where

import Prelude
import Data.Generic
import Read

data Color = Red | Green | Blue

derive instance genericColor :: Generic Color

instance showColor :: Show Color where
    show = gShow

instance readColor :: Read Color where
    read = gRead

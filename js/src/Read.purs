module Read where

import Data.Generic

class Read a where
    read :: String -> a

gRead :: forall a. Generic a => String -> a
gRead str =
